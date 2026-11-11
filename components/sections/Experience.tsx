"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import Reveal from "@/components/ui/Reveal";
import { useIsMobile } from "@/hooks/useMedia";

const OverflowScene = dynamic(() => import("@/components/three/OverflowScene"), { ssr: false });

export default function Experience() {
  const root = useRef<HTMLElement>(null);
  const mobile = useIsMobile();
  useGSAP(
    () => {
      gsap.fromTo(".exp-frame", { clipPath: "inset(18% 22% 18% 22% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: root.current, start: "top 80%", end: "top top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label="Brand experience" className="relative min-h-[100svh] overflow-hidden bg-noir">
      <div className="exp-frame absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_72%_62%,rgba(150,85,40,0.35),transparent_70%),radial-gradient(ellipse_40%_40%_at_90%_10%,rgba(196,154,98,0.15),transparent_70%)]">
        {/* coffee pours in from the side, fills the cup and spills over — in slow motion */}
        <div className="absolute inset-0" role="img" aria-label="Coffee pouring into a black cup until it overflows onto the saucer, in slow motion">
          <OverflowScene mobile={mobile} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-noir/80 via-noir/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-noir/50" />
      </div>

      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-start px-5 pb-28 pt-24 md:justify-center md:py-28 md:px-10">
        <p className="eyebrow mb-8 flex items-center gap-3"><span className="h-px w-10 bg-gold" />The KAS Experience</p>
        <Reveal
          className="display max-w-4xl text-[13vw] md:text-[7vw] xl:text-[108px]"
          lines={["Made for", { text: "the moments", className: "italic text-gold" }, "that matter."]}
          stagger={0.14}
        />
        <p className="mt-8 max-w-md text-[15px] leading-relaxed text-cream/70">
          The quiet first cup. The late-night conversation. The pause between everything. We roast for those.
        </p>
      </div>
    </section>
  );
}
