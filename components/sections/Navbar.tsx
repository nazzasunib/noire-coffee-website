"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { scrollToId } from "@/lib/smooth";

export const NAV = [
  { id: "home", label: "Home" },
  { id: "story", label: "Our Story" },
  { id: "collection", label: "Coffee Collection" },
  { id: "process", label: "Our Process" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const { count, setCartOpen } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [bump, setBump] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  useEffect(() => setBump((b) => b + 1), [count]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
          scrolled ? "border-b border-gold/10 bg-noir/75 py-3 backdrop-blur-xl" : "bg-transparent py-6"
        }`}
      >
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-5 md:px-10" aria-label="Main">
          <button onClick={() => go("home")} className="group flex flex-col items-start leading-none" aria-label="NOIRÉ Coffee — home">
            <span className="font-serif text-2xl tracking-[0.18em] text-cream transition-colors group-hover:text-gold">NOIRÉ</span>
            <span className="mt-1 text-[8px] font-semibold tracking-[0.5em] text-gold">COFFEE</span>
          </button>

          <ul className="hidden items-center gap-9 lg:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => go(n.id)}
                  className={`group relative py-2 text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-500 ${
                    active === n.id ? "text-gold" : "text-cream/70 hover:text-cream"
                  }`}
                >
                  {n.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-gold transition-all duration-500 ease-expo ${
                      active === n.id ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 text-cream transition-colors duration-500 hover:border-gold hover:text-gold"
              aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={bump}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: [1.4, 1] }}
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-noir"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={() => setOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 text-cream lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[70] flex flex-col bg-roast px-6 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-2xl tracking-[0.18em]">NOIRÉ</span>
              <button onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <ul className="mt-16 flex flex-col gap-3">
              {NAV.map((n, i) => (
                <motion.li key={n.id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                  <button onClick={() => go(n.id)} className="flex w-full items-baseline gap-4 border-b border-cream/10 py-4 text-left">
                    <span className="text-xs text-gold">0{i + 1}</span>
                    <span className="font-serif text-4xl font-light text-cream">{n.label}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
            <p className="mt-auto text-xs uppercase tracking-luxe text-cream/40">Every bean has a story.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
