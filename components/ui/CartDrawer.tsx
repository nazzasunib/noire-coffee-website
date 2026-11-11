"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/products";
import { getLenis, scrollToId } from "@/lib/smooth";
import BagArt from "./BagArt";

const FREE_SHIPPING = 50;

export default function CartDrawer() {
  const { state, items, subtotal, count, setCartOpen, setQty, remove, clear } = useStore();
  const open = state.cartOpen;

  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setCartOpen]);

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : 6;
  const remaining = Math.max(0, FREE_SHIPPING - subtotal);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed right-0 top-0 z-[90] flex h-[100dvh] w-full max-w-[460px] flex-col border-l border-gold/15 bg-roast"
            data-lenis-prevent
          >
            <header className="flex items-center justify-between border-b border-cream/10 px-6 py-5">
              <div>
                <h2 className="font-serif text-3xl font-light">Your Cart</h2>
                <p className="text-[10px] uppercase tracking-[0.25em] text-cream/40">{count} item{count === 1 ? "" : "s"} · demo store</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 hover:border-gold hover:text-gold" aria-label="Close cart">
                <X size={18} />
              </button>
            </header>

            {items.length > 0 && (
              <div className="border-b border-cream/10 px-6 py-4">
                <p className="text-xs text-cream/60">
                  {remaining > 0 ? <>Add <span className="text-gold">{formatPrice(remaining)}</span> more for free shipping</> : <>You&apos;ve unlocked <span className="text-gold">free shipping</span></>}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream/10">
                  <motion.div className="h-full bg-gold" animate={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 text-gold"><ShoppingBag size={28} strokeWidth={1.2} /></div>
                  <h3 className="mt-6 font-serif text-3xl font-light">Your cart is empty</h3>
                  <p className="mt-2 max-w-[260px] text-sm text-cream/50">Every great ritual starts with a single bag. Find yours.</p>
                  <button onClick={() => { setCartOpen(false); setTimeout(() => scrollToId("collection"), 350); }} className="btn-gold mt-8">Explore Collection</button>
                </div>
              ) : (
                <ul className="divide-y divide-cream/10">
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.li key={i.id} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0 }} className="flex gap-4 py-5">
                        <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-noir/60 p-2">
                          <BagArt product={i.product} className="h-full w-[70%]" />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <div>
                              <h3 className="font-serif text-xl leading-tight">{i.product.name}</h3>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-cream/40">{i.product.roast} · {i.product.weight}</p>
                            </div>
                            <button onClick={() => remove(i.id)} className="h-8 w-8 shrink-0 text-cream/40 hover:text-gold" aria-label={`Remove ${i.product.name}`}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center rounded-full border border-cream/15">
                              <button onClick={() => setQty(i.id, i.qty - 1)} className="flex h-9 w-9 items-center justify-center text-cream/70 hover:text-gold" aria-label="Decrease quantity"><Minus size={13} /></button>
                              <span className="w-6 text-center text-sm">{i.qty}</span>
                              <button onClick={() => setQty(i.id, i.qty + 1)} className="flex h-9 w-9 items-center justify-center text-cream/70 hover:text-gold" aria-label="Increase quantity"><Plus size={13} /></button>
                            </div>
                            <span className="font-serif text-xl text-gold">{formatPrice(i.lineTotal)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-cream/10 px-6 py-6">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between text-cream/60"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
                  <div className="flex justify-between text-cream/60"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
                  <div className="flex justify-between pt-2 font-serif text-2xl"><dt>Total</dt><dd className="text-gold">{formatPrice(subtotal + shipping)}</dd></div>
                </dl>
                <button disabled className="btn-gold mt-5 w-full cursor-not-allowed opacity-60" title="Demo store — checkout is disabled">
                  Checkout (demo — disabled)
                </button>
                <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cream/35">
                  <span>Demo shopping experience · no payments</span>
                  <button onClick={clear} className="hover:text-gold">Clear</button>
                </div>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
