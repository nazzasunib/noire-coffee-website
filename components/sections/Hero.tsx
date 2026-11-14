"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { sceneState } from "@/lib/sceneState";
import { scrollToId } from "@/lib/smooth";
import { useIsMobile, useReducedMotion } from "@/hooks/useMedia";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

function SceneFallback() {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-[18vh] md:items-center md:justify-end md:pb-0 md:pr-[18vw]">
      <div className="h-40 w-40 animate-pulse rounded-full bg-gold/10 blur-3xl" />
    </div>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const mobile = useIsMobile();
  const reduced = useReducedMotion();

  // pointer → shared scene state (normalised)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" }, paused: true, delay: 0.25 });
      tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 1.2 })
        .fromTo(".hero-title .line-inner", { yPercent: 115, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.6, stagger: 0.12 }, "-=0.9")
        .from(".hero-copy", { y: 24, opacity: 0, duration: 1.2 }, "-=1.1")
        .fromTo(".hero-cta > *", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, clearProps: "transform,opacity" }, "-=1")
        .from(".hero-meta > *", { opacity: 0, duration: 1.4 }, "-=0.8");

      const play = () => tl.play();
      if (sceneState.ready) play();
      else window.addEventListener("noire:ready", play, { once: true });

      // Pin the hero while the pour plays out; progress drives the 3D scene.
      const pin = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=130%",
          pin: true,
          scrub: 0.4,
          anticipatePin: 1,
          onUpdate: (self) => {
            sceneState.heroProgress = self.progress;
          },
        },
      });
      pin
        .to(".hero-content", { yPercent: -18, opacity: 0, duration: 0.18 }, 0)
        .to(".hero-meta", { opacity: 0, duration: 0.1 }, 0)
        .fromTo(".pour-copy", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.15 }, 0.42)
        .fromTo(".pour-copy .line-inner", { yPercent: 110 }, { yPercent: 0, duration: 0.2, stagger: 0.04 }, 0.42)
        .to({}, { duration: 1 - 0.62 }, 0.62);
    },
    { scope: root },
  );

  return (
    <section id="home" ref={root} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-noir">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_70%_55%,rgba(111,66,40,0.38),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_15%_10%,rgba(196,154,98,0.14),transparent_70%)]" />

      <HeroScene mobile={mobile} reduced={reduced} />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-noir to-transparent" />

      <div className="hero-content pointer-events-none relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-start px-5 pt-28 md:justify-center md:px-10 md:pt-0">
        <p className="hero-eyebrow eyebrow mb-6 flex items-center gap-3">
          <span className="h-px w-10 bg-gold" /> Artisan Coffee Experience
        </p>
        <h1 className="hero-title display text-[15vw] sm:text-[11vw] md:text-[7.4vw] xl:text-[112px]">
          <span className="line-mask"><span className="line-inner">The Art of</span></span>
          <span className="line-mask"><span className="line-inner italic text-gold">Exceptional</span></span>
          <span className="line-mask"><span className="line-inner">Coffee.</span></span>
        </h1>
        <p className="hero-copy mt-7 max-w-md text-[15px] leading-relaxed text-cream/65">
          Discover carefully selected coffee, crafted for those who appreciate every detail.
        </p>
        <div className="hero-cta pointer-events-auto mt-9 flex flex-wrap gap-3">
          <button onClick={() => scrollToId("collection")} className="btn-gold group">
            Explore Collection <ArrowRight size={15} className="transition-transform duration-500 group-hover:translate-x-1" />
          </button>
          <button onClick={() => scrollToId("story")} className="btn-ghost">
            Discover Our Story
          </button>
        </div>
      </div>

      {/* appears while cup 1 pours into cup 2 */}
      <div className="pour-copy pointer-events-none absolute inset-x-0 bottom-10 z-10 mx-auto max-w-[1400px] px-5 opacity-0 md:bottom-[18vh] md:px-10">
        <p className="eyebrow mb-4 flex items-center gap-3"><span className="h-px w-10 bg-gold" />The Pour</p>
        <h2 className="display text-[9vw] md:text-[5vw] xl:text-[76px]">
          <span className="line-mask"><span className="line-inner">From our cup</span></span>
          <span className="line-mask"><span className="line-inner italic text-gold">to yours.</span></span>
        </h2>
      </div>

      {/* meta + scroll indicator */}
      <div className="hero-meta pointer-events-none absolute inset-x-0 bottom-8 z-10 mx-auto flex max-w-[1400px] items-end justify-between px-5 md:px-10">
        <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cream/40 md:flex">
          <MousePointerClick size={13} /> Click the cup for a splash
        </div>
        <button onClick={() => scrollToId("story")} className="pointer-events-auto mx-auto flex flex-col items-center gap-3 md:mx-0" aria-label="Scroll to story">
          <span className="text-[10px] uppercase tracking-[0.35em] text-cream/50">Scroll</span>
          <span className="relative h-10 w-px overflow-hidden bg-cream/15">
            <span className="scroll-dot absolute left-0 top-0 h-3 w-px bg-gold" />
          </span>
        </button>
        <div className="hidden text-right text-[10px] uppercase tracking-[0.28em] text-cream/40 md:block">
          Est. 2026 <br /> Small-batch roasted
        </div>
      </div>
    </section>
  );
}
