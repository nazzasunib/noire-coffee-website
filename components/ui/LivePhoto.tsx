import Image from "next/image";
import type { ReactNode } from "react";

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
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className={`kenburns kenburns-${variant} absolute inset-0`}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${imgClassName}`} />
        {children}
      </div>
    </div>
  );
}
