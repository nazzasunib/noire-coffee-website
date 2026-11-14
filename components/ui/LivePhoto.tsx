"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A photo that is never still: slow Ken Burns drift (CSS) plus optional overlays
 * (steam, splash) that move with the image. `className` goes on the outer box so
 * GSAP can animate it independently of the drift.
 */
export default function LivePhoto({
  src,
  alt,
  sizes,
  className = "",
  imgClassName = "",
  variant = 0,
  priority = false,
  children,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  variant?: 0 | 1 | 2;
  priority?: boolean;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${onScreen ? "" : "is-offscreen"} ${className}`}>
      <div className={`kenburns kenburns-${variant} absolute inset-0`}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${imgClassName}`} />
        {children}
      </div>
    </div>
  );
}
