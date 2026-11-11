"use client";

import { useRef, type ElementType } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Props = {
  lines: (string | { text: string; className?: string })[];
  as?: ElementType;
  className?: string;
  delay?: number;
  /** animate immediately instead of on scroll */
  immediate?: boolean;
  stagger?: number;
};

/** Editorial line-by-line mask reveal. Each entry in `lines` is one masked line. */
export default function Reveal({ lines, as: Tag = "h2", className = "", delay = 0, immediate = false, stagger = 0.1 }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const inner = ref.current?.querySelectorAll(".line-inner");
      if (!inner?.length) return;
      gsap.fromTo(
        inner,
        { yPercent: 115, rotate: 2 },
        {
          yPercent: 0,
          rotate: 0,
          duration: 1.3,
          ease: "expo.out",
          stagger,
          delay,
          scrollTrigger: immediate ? undefined : { trigger: ref.current, start: "top 85%", once: true },
        },
      );
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className}>
      {lines.map((l, i) => {
        const text = typeof l === "string" ? l : l.text;
        const cls = typeof l === "string" ? "" : l.className ?? "";
        return (
          <span key={i} className="line-mask">
            <span className={`line-inner ${cls}`}>{text}</span>
          </span>
        );
      })}
    </Tag>
  );
}
