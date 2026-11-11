"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Rotate3d, ShoppingBag } from "lucide-react";
import { products, formatPrice } from "@/lib/products";
import { useStore } from "@/context/StoreContext";
import { useIsMobile } from "@/hooks/useMedia";
import Reveal from "@/components/ui/Reveal";

const ProductViewer = dynamic(() => import("@/components/three/ProductViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border border-gold/20 border-t-gold" />
    </div>
  ),
});

export default function Showcase() {
  const { state, setShowcase, add } = useStore();
  const mobile = useIsMobile();
  const [distance, setDistance] = useState(5.6);
  const [qty, setQty] = useState(1);
  const product = products.find((p) => p.id === state.showcaseId) ?? products[0];

  return (
    <section id="showcase" className="relative overflow-hidden bg-roast/40 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 transition-[background] duration-1000" style={{ background: `radial-gradient(ellipse 45% 55% at 40% 50%, ${product.palette.accent}22, transparent 70%)` }} />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-5 md:px-10 lg:grid-cols-12">
        <div className="relative order-2 h-[440px] md:h-[620px] lg:order-1 lg:col-span-7">
          <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/10" />
          <div className="absolute left-1/2 top-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gold/[0.07]" />
          <ProductViewer productId={product.id} mobile={mobile} distance={distance} />
          <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-cream/10 bg-noir/70 p-1.5 backdrop-blur">
            <button onClick={() => setDistance((d) => Math.min(8, d + 0.8))} className="flex h-9 w-9 items-center justify-center rounded-full text-cream hover:bg-cream/10" aria-label="Zoom out"><Minus size={14} /></button>
            <span className="flex items-center gap-2 px-2 text-[10px] uppercase tracking-[0.2em] text-cream/50"><Rotate3d size={14} /> Drag to rotate</span>
            <button onClick={() => setDistance((d) => Math.max(3.4, d - 0.8))} className="flex h-9 w-9 items-center justify-center rounded-full text-cream hover:bg-cream/10" aria-label="Zoom in"><Plus size={14} /></button>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5">
          <p className="eyebrow mb-6 flex items-center gap-3"><span className="h-px w-10 bg-gold" />Interactive 3D</p>
          <Reveal className="display text-[11vw] md:text-[4.6vw] xl:text-[64px]" lines={["Hold it in", { text: "your hands.", className: "italic text-gold" }]} />

          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Choose a coffee">
            {products.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === product.id}
                onClick={() => setShowcase(p.id)}
                className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-all duration-500 ${
                  p.id === product.id ? "border-gold bg-gold text-noir" : "border-cream/15 text-cream/70 hover:border-gold/60 hover:text-cream"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mt-10">
              <h3 className="font-serif text-4xl font-light text-cream md:text-5xl">{product.name}</h3>
              <p className="mt-1 font-serif text-xl italic text-gold">{product.tagline}</p>
              <p className="mt-5 text-[15px] leading-relaxed text-cream/60">{product.description}</p>
              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-cream/10 py-6 text-sm">
                {[
                  ["Origin", product.origin],
                  ["Type", product.type],
                  ["Roast", product.roast],
                  ["Weight", product.weight],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] uppercase tracking-[0.22em] text-cream/40">{k}</dt>
                    <dd className="mt-1 text-cream">{v}</dd>
                  </div>
                ))}
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-[0.22em] text-cream/40">Intensity</dt>
                  <dd className="mt-2 flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`h-1.5 w-8 rounded-full ${i < product.intensity ? "bg-gold" : "bg-cream/10"}`} />
                    ))}
                  </dd>
                </div>
              </dl>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="font-serif text-4xl text-cream">{formatPrice(product.price)}</span>
                <div className="flex items-center rounded-full border border-cream/15">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-cream/70 hover:text-gold" aria-label="Decrease quantity"><Minus size={14} /></button>
                  <span className="w-6 text-center text-sm" aria-live="polite">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-11 w-11 items-center justify-center text-cream/70 hover:text-gold" aria-label="Increase quantity"><Plus size={14} /></button>
                </div>
                <button onClick={() => { add(product.id, qty); setQty(1); }} className="btn-gold flex-1 sm:flex-none">
                  <ShoppingBag size={15} /> Add to Cart
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
