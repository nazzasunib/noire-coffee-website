"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import Reveal from "@/components/ui/Reveal";

export default function Experience() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(".exp-bg", { scale: 1.25, yPercent: -8 }, { scale: 1, yPercent: 8, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(".exp-card-a", { yPercent: 40 }, { yPercent: -40, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(".exp-card-b", { yPercent: 70 }, { yPercent: -60, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(".exp-frame", { clipPath: "inset(18% 22% 18% 22% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: root.current, start: "top 80%", end: "top top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label="Brand experience" className="relative min-h-[100svh] overflow-hidden bg-noir">
      <div className="exp-frame absolute inset-0">
        <Image src="/images/glass-splash.webp" alt="Espresso splashing out of a glass cup with flying coffee beans" fill sizes="100vw" className="exp-bg object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/70 to-noir/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/60" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-center px-5 py-28 md:px-10">
        <p className="eyebrow mb-8 flex items-center gap-3"><span className="h-px w-10 bg-gold" />The NOIRÉ Experience</p>
        <Reveal
          className="display max-w-4xl text-[13vw] md:text-[7vw] xl:text-[108px]"
          lines={["Made for", { text: "the moments", className: "italic text-gold" }, "that matter."]}
          stagger={0.14}
        />
        <p className="mt-8 max-w-md text-[15px] leading-relaxed text-cream/70">
          The quiet first cup. The late-night conversation. The pause between everything. We roast for those.
        </p>
      </div>

      <div className="exp-card-a absolute bottom-[12%] right-[6%] z-10 hidden aspect-square w-[20vw] max-w-[300px] overflow-hidden border-[6px] border-noir shadow-2xl md:block">
        <Image src="/images/crown-splash.webp" alt="Coffee crown splash" fill sizes="20vw" className="object-cover" />
      </div>
      <div className="exp-card-b absolute right-[24%] top-[18%] z-10 hidden aspect-[3/4] w-[13vw] max-w-[200px] overflow-hidden border-[6px] border-noir shadow-2xl lg:block">
        <Image src="/images/smoke-cup.webp" alt="Steaming black coffee" fill sizes="13vw" className="object-cover" />
      </div>
    </section>
  );
}
