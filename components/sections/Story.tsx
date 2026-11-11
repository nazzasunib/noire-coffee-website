"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import Reveal from "@/components/ui/Reveal";
import FadeUp from "@/components/ui/FadeUp";

const STATS = [
  { n: "12", l: "Partner farms" },
  { n: "1,850m", l: "Avg. altitude" },
  { n: "48h", l: "Roast to door" },
];

export default function Story() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // cinematic mask reveal for each framed image
      gsap.utils.toArray<HTMLElement>(".story-frame").forEach((frame) => {
        const img = frame.querySelector("img");
        gsap.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.6,
          ease: "expo.inOut",
          scrollTrigger: { trigger: frame, start: "top 85%", once: true },
        });
        if (img) {
          gsap.fromTo(img, { scale: 1.35 }, { scale: 1.1, duration: 2, ease: "expo.out", scrollTrigger: { trigger: frame, start: "top 85%", once: true } });
          gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } });
        }
      });
      // floating beans drift at different speeds
      gsap.utils.toArray<HTMLElement>(".story-bean").forEach((el, i) => {
        gsap.to(el, { y: -160 - i * 70, rotate: 90 + i * 40, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
      // the big ghost word slides as you scroll
      gsap.fromTo(".story-ghost", { xPercent: 10 }, { xPercent: -25, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section id="story" ref={root} className="relative overflow-hidden bg-noir py-28 md:py-44">
      <div className="story-ghost pointer-events-none absolute left-0 top-16 select-none whitespace-nowrap font-serif text-[24vw] font-light italic leading-none text-cream/[0.03]">
        ritual · origin · ritual
      </div>

      {/* decorative beans */}
      {[
        "left-[6%] top-[38%] w-10",
        "right-[8%] top-[20%] w-14",
        "right-[42%] bottom-[10%] w-8",
      ].map((c, i) => (
        <svg key={i} viewBox="0 0 40 60" className={`story-bean pointer-events-none absolute ${c} opacity-40`} aria-hidden>
          <ellipse cx="20" cy="30" rx="16" ry="26" fill="#3a2214" />
          <path d="M20 6 C 30 20, 10 38, 20 54" stroke="#120a06" strokeWidth="3" fill="none" />
        </svg>
      ))}

      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-16 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6 lg:col-span-5">
            <p className="eyebrow mb-8 flex items-center gap-3"><span className="h-px w-10 bg-gold" />01 — Our Story</p>
            <Reveal
              className="display text-[13vw] md:text-[5.6vw] xl:text-[84px]"
              lines={["More than", { text: "coffee.", className: "italic text-gold" }, "It's a ritual."]}
            />
            <FadeUp className="mt-10 space-y-6 text-[15px] leading-[1.85] text-cream/65">
              <p>
                NOIRÉ began with a single cup in a quiet kitchen at dawn — the kind of cup that makes you stop. We have been chasing
                that feeling ever since, travelling to the farms behind every bean and roasting in small batches so nothing is lost
                along the way.
              </p>
              <p>
                Our coffee is grown on volcanic slopes in Ethiopia, Colombia and Sumatra by families who have tended the same trees
                for generations. We buy directly, pay above fair-trade, and roast each lot to reveal its own character — never to
                hide it.
              </p>
            </FadeUp>
            <FadeUp className="mt-14 grid grid-cols-3 gap-4 border-t border-cream/10 pt-8">
              {STATS.map((s) => (
                <div key={s.l}>
                  <div className="font-serif text-3xl text-cream md:text-4xl">{s.n}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-cream/45">{s.l}</div>
                </div>
              ))}
            </FadeUp>
          </div>

          <div className="relative md:col-span-6 lg:col-span-6 lg:col-start-7">
            <div className="story-frame relative aspect-[4/5] w-full overflow-hidden rounded-[2px]">
              <Image src="/images/espresso-light.webp" alt="Espresso in a faceted black cup lit by a ray of morning light" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/60 via-transparent to-transparent" />
              <p className="absolute bottom-6 left-6 font-serif text-xl italic text-cream/90">The first light of the day.</p>
            </div>
            <div className="story-frame absolute -bottom-16 -left-6 hidden aspect-square w-[44%] overflow-hidden rounded-[2px] border-[6px] border-noir shadow-2xl md:block lg:-left-24">
              <Image src="/images/smoke-cup.webp" alt="Steam curling over a black coffee" fill sizes="20vw" className="object-cover" />
            </div>
          </div>
        </div>

        {/* origin journey */}
        <div className="mt-36 grid gap-6 md:mt-52 md:grid-cols-3">
          {[
            { img: "/images/beans-cup.webp", step: "Origin", title: "Grown on volcanic slopes", body: "Hand-picked at peak ripeness, one cherry at a time." },
            { img: "/images/clay-cup.webp", step: "Craft", title: "Roasted with patience", body: "Small batches, profiled by ear, smell and colour." },
            { img: "/images/swirl-cup.webp", step: "Ritual", title: "Poured with intent", body: "A cup that asks you to slow down — and rewards you." },
          ].map((c, i) => (
            <article key={c.step} className={`group ${i === 1 ? "md:mt-24" : ""}`}>
              <div className="story-frame relative aspect-[4/3] overflow-hidden">
                <Image src={c.img} alt={c.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-[1.6s] ease-expo group-hover:scale-110" />
                <span className="absolute left-4 top-4 rounded-full border border-cream/30 bg-noir/40 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-cream backdrop-blur">
                  0{i + 1} · {c.step}
                </span>
              </div>
              <h3 className="mt-6 font-serif text-3xl font-light text-cream">{c.title}</h3>
              <p className="mt-2 text-sm text-cream/55">{c.body}</p>
            </article>
          ))}
        </div>
      </div>

      {/* origin marquee */}
      <div className="mt-32 overflow-hidden border-y border-gold/15 py-6">
        <div className="marquee flex w-max gap-12 whitespace-nowrap font-serif text-3xl italic text-cream/70 md:text-5xl">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12" aria-hidden={k === 1}>
              {["Yirgacheffe", "Huila", "Aceh", "Cerrado", "Antigua", "Nyeri", "Tarrazú"].map((o) => (
                <span key={o} className="flex items-center gap-12">
                  {o} <span className="text-base not-italic text-gold">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
