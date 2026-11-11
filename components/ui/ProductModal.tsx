"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X, Rotate3d } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { products, formatPrice } from "@/lib/products";
import { getLenis, scrollToId } from "@/lib/smooth";
import BagSpin from "./BagSpin";

export default function ProductModal() {
  const { state, openDetail, add, setCartOpen } = useStore();
  const product = products.find((p) => p.id === state.detailId);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
    const lenis = getLenis();
    if (product) lenis?.stop();
    else if (!state.cartOpen) lenis?.start();
    document.documentElement.style.overflow = product ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openDetail(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product, openDetail, state.cartOpen]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => openDetail(null)}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            data-lenis-prevent
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 80, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative grid max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-[24px] border border-gold/15 bg-roast md:grid-cols-2 md:rounded-[24px]"
          >
            <button onClick={() => openDetail(null)} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 bg-noir/50 hover:border-gold hover:text-gold" aria-label="Close details">
              <X size={18} />
            </button>
            <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-noir p-10" style={{ background: `radial-gradient(circle at 50% 45%, ${product.palette.accent}33, #100b08 70%)` }}>
              <motion.div initial={{ rotate: -8, y: 30, opacity: 0 }} animate={{ rotate: -3, y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }} className="flex h-[320px] w-[220px] items-center justify-center">
                <BagSpin product={product} w={200} h={312} />
              </motion.div>
              <div className="absolute bottom-10 h-6 w-40 rounded-[50%] bg-black/70 blur-xl" />
            </div>
            <div className="flex flex-col p-7 md:p-10">
              <p className="eyebrow">{product.type} · {product.roast}</p>
              <h2 className="mt-3 font-serif text-5xl font-light leading-none">{product.name}</h2>
              <p className="mt-2 font-serif text-xl italic text-gold">{product.tagline}</p>
              <p className="mt-6 text-[15px] leading-relaxed text-cream/60">{product.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {product.notes.map((n) => (
                  <span key={n} className="rounded-full border border-gold/30 px-3 py-1 text-xs text-cream/80">{n}</span>
                ))}
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-cream/10 py-5 text-sm">
                <div><dt className="text-[10px] uppercase tracking-[0.2em] text-cream/40">Origin</dt><dd className="mt-1">{product.origin}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-[0.2em] text-cream/40">Weight</dt><dd className="mt-1">{product.weight}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-[0.2em] text-cream/40">Intensity</dt><dd className="mt-1">{product.intensity}/5</dd></div>
              </dl>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-serif text-4xl text-gold">{formatPrice(product.price * qty)}</span>
                <div className="flex items-center rounded-full border border-cream/15">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center hover:text-gold" aria-label="Decrease quantity"><Minus size={14} /></button>
                  <span className="w-6 text-center">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="flex h-11 w-11 items-center justify-center hover:text-gold" aria-label="Increase quantity"><Plus size={14} /></button>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => { add(product.id, qty); openDetail(null); setTimeout(() => setCartOpen(true), 250); }} className="btn-gold flex-1">
                  <ShoppingBag size={15} /> Add to Cart
                </button>
                <button onClick={() => { openDetail(null); setTimeout(() => scrollToId("showcase"), 300); }} className="btn-ghost">
                  <Rotate3d size={15} /> View in 3D
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
