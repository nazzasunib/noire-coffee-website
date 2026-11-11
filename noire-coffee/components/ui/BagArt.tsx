"use client";

import { useEffect, useRef } from "react";
import { drawBagFace } from "@/lib/geometry";
import type { Product } from "@/lib/products";

/** 2D render of the same label artwork used on the 3D bag, shaped as a pouch. */
export default function BagArt({ product, className = "" }: { product: Product; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => drawBagFace(cv.getContext("2d")!, cv.width, cv.height, product.palette, product, "color", "front");
    draw();
    document.fonts?.ready.then(draw);
  }, [product]);
  return (
    <div className={`relative ${className}`}>
      <canvas ref={ref} width={480} height={750} className="h-full w-full rounded-[10px_10px_6px_6px] object-cover" aria-label={`${product.name} coffee bag`} role="img" />
      {/* pouch shading */}
      <div className="pointer-events-none absolute inset-0 rounded-[10px_10px_6px_6px] bg-[linear-gradient(90deg,rgba(0,0,0,0.45)_0%,rgba(255,255,255,0.08)_22%,rgba(255,255,255,0)_45%,rgba(0,0,0,0.05)_70%,rgba(0,0,0,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[9%] rounded-t-[10px] bg-gradient-to-b from-black/30 to-transparent" />
      <div className="pointer-events-none absolute left-[22%] top-[10%] h-[80%] w-[10%] rounded-full bg-white/10 blur-xl" />
    </div>
  );
}
