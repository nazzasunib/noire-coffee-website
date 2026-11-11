"use client";

import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; hue: number };

/**
 * Slow-motion coffee splash: glossy droplets keep arcing out of a point in a photo and falling away.
 * `x`/`y` = emitter position (percent of the frame), `spread` = width of the emitter (percent).
 * Canvas 2D, paused off-screen, disabled for reduced motion.
 */
export default function SlowSplash({ x, y, spread = 30, rate = 26, power = 1 }: { x: number; y: number; spread?: number; rate?: number; power?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d")!;
    let W = 0, H = 0, dpr = 1, raf = 0, last = performance.now(), acc = 0, visible = true;
    const ps: P[] = [];

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);

    const spawn = () => {
      const s = Math.min(W, H) / 500; // scale to frame size
      const ex = (x + (Math.random() - 0.5) * spread) / 100 * W;
      const ey = (y / 100) * H;
      // fan outwards and upwards, biased away from the centre of the emitter
      const side = ex < (x / 100) * W ? -1 : 1;
      const a = -Math.PI / 2 + side * (0.25 + Math.random() * 0.95);
      const sp = (55 + Math.random() * 95) * s * power;
      const big = Math.random() < 0.08;
      ps.push({ x: ex, y: ey, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: (big ? 3.2 + Math.random() * 2.4 : 1 + Math.random() * 2.4) * s, life: 0, max: 3.2 + Math.random() * 2.2, hue: 22 + Math.random() * 14 });
    };

    const draw = (p: P, alpha: number) => {
      const v = Math.hypot(p.vx, p.vy) || 1;
      const stretch = 1 + Math.min(1.6, v / 120);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.globalAlpha = alpha * 0.85;
      const g = ctx.createRadialGradient(-p.r * 0.3, -p.r * 0.3, 0, 0, 0, p.r * stretch);
      g.addColorStop(0, `hsla(${p.hue + 10}, 85%, 72%, 1)`);
      g.addColorStop(0.35, `hsla(${p.hue}, 80%, 45%, 0.95)`);
      g.addColorStop(1, `hsla(${p.hue - 6}, 85%, 18%, 0.9)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * stretch, p.r, 0, 0, Math.PI * 2);
      ctx.fill();
      // specular glint
      ctx.fillStyle = "rgba(255,240,215,0.85)";
      ctx.beginPath();
      ctx.arc(p.r * 0.35 * stretch, -p.r * 0.35, p.r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || !W) return;
      const slow = 0.45; // slow-motion time scale
      const t = dt * slow;
      acc += dt * rate;
      while (acc > 1) {
        spawn();
        acc -= 1;
      }
      const g = 140 * (Math.min(W, H) / 500);
      ctx.clearRect(0, 0, W, H);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vy += g * t;
        p.vx *= 1 - 0.15 * t;
        p.x += p.vx * t;
        p.y += p.vy * t;
        p.life += dt;
        if (p.life > p.max || p.y > H + 20) {
          ps.splice(i, 1);
          continue;
        }
        const fadeIn = Math.min(1, p.life * 4);
        const fadeOut = Math.min(1, (p.max - p.life) * 1.5);
        draw(p, fadeIn * fadeOut);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [x, y, spread, rate, power]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
