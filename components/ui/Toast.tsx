"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function Toast() {
  const { state, dismissToast, setCartOpen } = useStore();
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(dismissToast, 2600);
    return () => clearTimeout(t);
  }, [state.toast, dismissToast]);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[95] -translate-x-1/2" aria-live="polite">
      <AnimatePresence>
        {state.toast && (
          <motion.div key={state.toast.id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-3 whitespace-nowrap rounded-full border border-gold/30 bg-roast/95 py-2 pl-2 pr-5 text-sm shadow-2xl backdrop-blur">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-noir"><Check size={15} /></span>
            {state.toast.text}
            <button onClick={() => { dismissToast(); setCartOpen(true); }} className="ml-2 text-[11px] uppercase tracking-[0.2em] text-gold underline-offset-4 hover:underline">View</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
