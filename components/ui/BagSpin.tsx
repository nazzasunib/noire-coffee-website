"use client";

import { useEffect, useRef } from "react";
import { drawBagFace } from "@/lib/geometry";
import type { Product } from "@/lib/products";

/** Lightweight CSS-3D coffee pouch that keeps turning (front + back labels, gusset sides). */
export default function BagSpin({ product, w = 154, h = 240, delay = 0 }: { product: Product; w?: number; h?: number; delay?: number }) {
  const front = useRef<HTMLCanvasElement>(null);
  const back = useRef<HTMLCanvasElement>(null);
  const d = Math.round(w * 0.4);

  useEffect(() => {
    const paint = () => {
      ([
        [front.current, "front"],
        [back.current, "back"],
      ] as const).forEach(([cv, side]) => {
        if (cv) drawBagFace(cv.getContext("2d")!, cv.width, cv.height, product.palette, product, "color", side);
      });
    };
    paint();
    document.fonts?.ready.then(paint);
  }, [product]);

  const shade = "linear-gradient(90deg,rgba(0,0,0,0.35) 0%,rgba(255,255,255,0.1) 25%,rgba(255,255,255,0) 50%,rgba(0,0,0,0.3) 100%)";
  const side = (deg: number) => ({
    width: d,
    left: (w - d) / 2,
    transform: `rotateY(${deg}deg) translateZ(${w / 2}px)`,
    background: `linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55)), ${product.palette.bag}`,
  });

  return (
    <div className="bag-spin-wrap relative" style={{ width: w, height: h, perspective: 900 }} role="img" aria-label={`${product.name} coffee bag, rotating`}>
      <div className="bag-spin absolute inset-0" style={{ animationDelay: `${-delay}s` }}>
        <div className="bag-face" style={{ transform: `translateZ(${d / 2}px)` }}>
          <canvas ref={front} width={480} height={750} className="h-full w-full" />
          <div className="absolute inset-0" style={{ background: shade }} />
        </div>
        <div className="bag-face" style={{ transform: `rotateY(180deg) translateZ(${d / 2}px)` }}>
          <canvas ref={back} width={480} height={750} className="h-full w-full" />
          <div className="absolute inset-0" style={{ background: shade }} />
        </div>
        <div className="bag-face !rounded-[4px]" style={side(90)} />
        <div className="bag-face !rounded-[4px]" style={side(-90)} />
        {/* top seal */}
        <div
          className="absolute rounded-sm"
          style={{ width: w, height: d, top: -d / 2, transform: `rotateX(90deg)`, background: product.palette.bag, filter: "brightness(0.7)" }}
        />
      </div>
    </div>
  );
}
