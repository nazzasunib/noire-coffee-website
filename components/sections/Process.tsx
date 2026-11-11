"use client";

import LivePhoto from "@/components/ui/LivePhoto";
import CupSteam from "@/components/ui/CupSteam";
import SlowSplash from "@/components/ui/SlowSplash";
import dynamic from "next/dynamic";

const FloatingCupsScene = dynamic(() => import("@/components/three/FloatingCupsScene"), { ssr: false });
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import Reveal from "@/components/ui/Reveal";

function Overlay({ k }: { k: string }) {
  if (k === "Roast") return <CupSteam x={45} y={30} w={40} warm />;
  if (k === "Brew") return <SlowSplash x={47} y={52} spread={36} rate={30} />;
  return null;
}

const STEPS = [
  { k: "Source", t: "Carefully selected coffee beans.", d: "We cup hundreds of samples each season and choose only lots scoring 86+ — bought directly from the families who grow them.", img: "/images/beans-cup.webp", bg: "#120c09" },
  { k: "Roast", t: "Expertly roasted for balanced flavor.", d: "Small 12 kg batches, profiled by hand. We stop each roast at the exact moment the origin speaks clearest.", img: "/images/gold-cup.webp", bg: "#1b110b" },
  { k: "Brew", t: "Crafted for a memorable experience.", d: "Every bag ships with a brew card — dose, ratio and temperature tuned to that specific roast.", img: "/images/splash-cup.webp", bg: "#21140d" },
  { k: "Enjoy", t: "Every cup tells a story.", d: "Slow down. Notice the aroma, the first sip, the finish. That moment is what we roast for.", img: "/images/floating-cups.webp", bg: "#140d09" },
];

export default function Process() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const st = ScrollTrigger.create({
          trigger: pin.current,
          start: "top top",
          end: "+=280%",
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length * 0.999)));
            gsap.set(".process-progress", { scaleY: self.progress });
            gsap.set(".process-bean", { rotate: self.progress * 540, y: self.progress * -80 });
          },
        });
        return () => st.kill();
      });
      mm.add("(max-width: 1023px)", () => {
        gsap.utils.toArray<HTMLElement>(".process-step-m").forEach((el) => {
          gsap.from(el, { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="process" ref={root} className="relative bg-noir">
      {/* Desktop — pinned cinematic timeline */}
      <div ref={pin} className="relative hidden h-screen overflow-hidden transition-colors duration-1000 lg:block" style={{ backgroundColor: STEPS[active].bg }}>
        <div className="mx-auto grid h-full max-w-[1400px] grid-cols-12 items-center gap-10 px-10">
          <div className="col-span-5">
            <p className="eyebrow mb-8 flex items-center gap-3"><span className="h-px w-10 bg-gold" />03 — Our Process</p>
            <Reveal className="display text-[5vw] xl:text-[76px]" lines={["From seed", { text: "to sip.", className: "italic text-gold" }]} />
            <div className="mt-14 flex gap-8">
              <div className="relative w-px bg-cream/10">
                <div className="process-progress absolute inset-0 origin-top scale-y-0 bg-gold" />
              </div>
              <ol className="flex flex-col gap-7">
                {STEPS.map((s, i) => (
                  <li key={s.k} className={`transition-all duration-700 ease-expo ${i === active ? "opacity-100" : "opacity-30"}`}>
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs text-gold">0{i + 1}</span>
                      <span className={`font-serif text-4xl font-light transition-transform duration-700 ease-expo ${i === active ? "translate-x-2 text-cream" : "text-cream/80"}`}>{s.k}</span>
                    </div>
                    <div className={`grid transition-all duration-700 ease-expo ${i === active ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden pl-9">
                        <p className="font-serif text-xl italic text-gold">{s.t}</p>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-cream/55">{s.d}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="relative col-span-6 col-start-7 h-[72vh]">
            <svg viewBox="0 0 40 60" className="process-bean absolute -left-10 top-6 z-10 w-16" aria-hidden>
              <ellipse cx="20" cy="30" rx="16" ry="26" fill="#4a2b18" />
              <path d="M20 6 C 30 20, 10 38, 20 54" stroke="#1a0f08" strokeWidth="3" fill="none" />
            </svg>
            {STEPS.map((s, i) => (
              <div
                key={s.k}
                className="absolute inset-0 overflow-hidden rounded-[2px] transition-all duration-[1.2s] ease-expo"
                style={{
                  clipPath: i === active ? "inset(0% 0% 0% 0%)" : i < active ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)",
                }}
              >
                {s.k === "Enjoy" ? (
                  <div className="absolute inset-0" role="img" aria-label="Cups and saucers floating weightlessly around a steaming cup">
                    <FloatingCupsScene active={i === active} />
                  </div>
                ) : (
                  <LivePhoto src={s.img} alt={`${s.k}: ${s.t}`} sizes="50vw" variant={(i % 3) as 0 | 1 | 2} className={`transition-transform duration-[1.6s] ease-expo ${i === active ? "scale-100" : "scale-125"}`}>
                    {i === active && <Overlay k={s.k} />}
                  </LivePhoto>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            ))}
            <div className="absolute -bottom-6 right-0 font-serif text-[180px] font-light leading-none text-cream/10">0{active + 1}</div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet — stacked */}
      <div className="px-5 py-24 md:px-10 lg:hidden">
        <p className="eyebrow mb-8 flex items-center gap-3"><span className="h-px w-10 bg-gold" />03 — Our Process</p>
        <Reveal className="display text-[13vw] md:text-[8vw]" lines={["From seed", { text: "to sip.", className: "italic text-gold" }]} />
        <div className="mt-14 flex flex-col gap-14">
          {STEPS.map((s, i) => (
            <article key={s.k} className="process-step-m">
              <div className="relative aspect-[4/3] overflow-hidden">
                {s.k === "Enjoy" ? (
                  <div className="absolute inset-0" role="img" aria-label="Cups and saucers floating weightlessly around a steaming cup">
                    <FloatingCupsScene />
                  </div>
                ) : (
                  <LivePhoto src={s.img} alt={`${s.k}: ${s.t}`} sizes="100vw" variant={(i % 3) as 0 | 1 | 2}>
                    <Overlay k={s.k} />
                  </LivePhoto>
                )}
                <span className="absolute bottom-4 left-4 font-serif text-6xl font-light text-cream/80">0{i + 1}</span>
              </div>
              <h3 className="mt-6 font-serif text-4xl font-light">{s.k}</h3>
              <p className="mt-2 font-serif text-xl italic text-gold">{s.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-cream/55">{s.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
