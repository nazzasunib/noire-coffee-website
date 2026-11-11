"use client";

import { useEffect, useState } from "react";
import { sceneState } from "@/lib/sceneState";

/**
 * Short branded intro curtain while the 3D scene warms up.
 * Uses CSS transitions (compositor-driven) plus a CSS fail-safe so it can never block the page.
 */
export default function Loader() {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    const start = performance.now();
    const DURATION = 1400;
    let leaveTimer: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      const v = Math.min(100, Math.round(((performance.now() - start) / DURATION) * 100));
      setN(v);
      if (v >= 100) {
        clearInterval(id);
        setPhase("leaving");
        sceneState.ready = true;
        window.dispatchEvent(new Event("noire:ready"));
        leaveTimer = setTimeout(() => setPhase("done"), 1100);
      }
    }, 50);
    return () => {
      clearInterval(id);
      clearTimeout(leaveTimer);
    };
  }, []);

  if (phase === "done") return null;
  return (
    <div
      aria-hidden
      className={`loader-failsafe fixed inset-0 z-[100] flex flex-col items-center justify-center bg-noir transition-[clip-path] duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        phase === "leaving" ? "pointer-events-none [clip-path:inset(0_0_100%_0)]" : "[clip-path:inset(0_0_0%_0)]"
      }`}
    >
      <div className="loader-in text-center">
        <div className="font-serif text-5xl tracking-[0.22em] md:text-7xl">KASH</div>
        <div className="mt-3 text-[10px] tracking-[0.5em] text-gold">EVERY BEAN HAS A STORY</div>
      </div>
      <div className="mt-10 h-px w-48 overflow-hidden bg-cream/10">
        <div className="h-full bg-gold transition-[width] duration-150" style={{ width: `${n}%` }} />
      </div>
      <div className="mt-3 font-serif text-sm text-cream/40">{n}%</div>
    </div>
  );
}
