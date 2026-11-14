"use client";

import { useEffect, useRef } from "react";

type P = {
  x: number; y: number; vx: number; vy: number;
  r: number; life: number; max: number;
  depth: number; // 0 = in focus, 1 = far out of focus (soft bokeh)
  tone: number; // 0 dark espresso → 1 light amber crema
  wob: number;
};

/** Pre-rendered droplet sprites (in-focus and defocused), tinted from espresso to crema. */
function makeSprites() {
  const tones = [
    ["rgba(255,214,150,0.95)", "rgba(196,110,38,0.9)", "rgba(92,40,10,0.92)", "rgba(40,16,4,0.95)"],
    ["rgba(255,226,170,0.95)", "rgba(214,132,52,0.88)", "rgba(120,58,18,0.9)", "rgba(54,22,6,0.95)"],
    ["rgba(250,200,130,0.9)", "rgba(170,88,28,0.9)", "rgba(70,30,8,0.94)", "rgba(28,12,3,0.96)"],
  ];
  const sharp = tones.map(([hi, mid, low, edge]) => {
    const S = 64;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const c = cv.getContext("2d")!;
    const r = S / 2 - 2;
    // translucent body: light comes through the far side (caustic) and the rim reads dark
    const body = c.createRadialGradient(S / 2 + r * 0.25, S / 2 + r * 0.3, r * 0.05, S / 2, S / 2, r);
    body.addColorStop(0, hi);
    body.addColorStop(0.35, mid);
    body.addColorStop(0.8, low);
    body.addColorStop(1, edge);
    c.fillStyle = body;
    c.beginPath();
    c.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    c.fill();
    // tight specular reflection of the key light (small, slightly soft — not a cartoon dot)
    const sp = c.createRadialGradient(S / 2 - r * 0.38, S / 2 - r * 0.42, 0, S / 2 - r * 0.38, S / 2 - r * 0.42, r * 0.22);
    sp.addColorStop(0, "rgba(255,248,235,0.9)");
    sp.addColorStop(1, "rgba(255,248,235,0)");
    c.fillStyle = sp;
    c.fillRect(0, 0, S, S);
    // thin rim light on the lower edge
    c.strokeStyle = "rgba(255,190,120,0.35)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(S / 2, S / 2, r - 1, Math.PI * 0.15, Math.PI * 0.75);
    c.stroke();
    return cv;
  });
  // soft out-of-focus bokeh disc
  const S = 64;
  const bokeh = document.createElement("canvas");
  bokeh.width = bokeh.height = S;
  const b = bokeh.getContext("2d")!;
  const g = b.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(230,150,70,0.55)");
  g.addColorStop(0.6, "rgba(190,105,40,0.35)");
  g.addColorStop(1, "rgba(150,80,30,0)");
  b.fillStyle = g;
  b.fillRect(0, 0, S, S);
  return { sharp, bokeh };
}

/**
 * Slow-motion coffee splash over a photo: translucent amber droplets with dark rims,
 * tiny speculars, velocity stretch and depth-of-field bokeh, arcing out and falling away.
 * `x`/`y` = emitter (percent of frame), `spread` = emitter width (percent).
 */
export default function SlowSplash({ x, y, spread = 30, rate = 26, power = 1 }: { x: number; y: number; spread?: number; rate?: number; power?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d")!;
    const sprites = makeSprites();
    let W = 0, H = 0, raf = 0, last = performance.now(), acc = 0, visible = true;
    const ps: P[] = [];

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
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
      const s = Math.min(W, H) / 500;
      const cx = (x / 100) * W;
      const ex = cx + ((Math.random() - 0.5) * spread * W) / 100;
      const ey = (y / 100) * H + (Math.random() - 0.5) * 6 * s;
      const side = ex < cx ? -1 : 1;
      const a = -Math.PI / 2 + side * (0.15 + Math.random() * 1.05);
      const sp = (60 + Math.random() * 110) * s * power;
      // size distribution: mostly fine droplets, a few medium, rare large
      const roll = Math.random();
      const r = (roll < 0.7 ? 0.7 + Math.random() * 1.4 : roll < 0.95 ? 2 + Math.random() * 2 : 4 + Math.random() * 2.5) * s;
      const depth = Math.random() < 0.18 ? 0.6 + Math.random() * 0.4 : Math.random() * 0.15;
      ps.push({ x: ex, y: ey, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r, life: 0, max: 3 + Math.random() * 2.5, depth, tone: Math.floor(Math.random() * 3), wob: Math.random() * 6 });
    };

    const draw = (p: P, alpha: number) => {
      const v = Math.hypot(p.vx, p.vy);
      if (p.depth > 0.5) {
        // defocused droplet: soft disc, no highlight
        const d = p.r * (2.4 + p.depth * 3);
        ctx.globalAlpha = alpha * (0.35 + (1 - p.depth) * 0.3);
        ctx.drawImage(sprites.bokeh, p.x - d / 2, p.y - d / 2, d, d);
        return;
      }
      // surface tension wobble + motion stretch along velocity (shutter blur)
      const stretch = 1 + Math.min(1.4, v / 140);
      const wob = 1 + Math.sin(p.life * 9 + p.wob) * 0.06;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.globalAlpha = alpha * 0.92;
      const rx = p.r * stretch * wob;
      const ry = p.r / wob;
      ctx.drawImage(sprites.sharp[p.tone], -rx, -ry, rx * 2, ry * 2);
      // faint trailing smear for the fastest drops
      if (v > 90 && p.r > 1.2) {
        ctx.globalAlpha = alpha * 0.18;
        ctx.drawImage(sprites.sharp[p.tone], -rx * 2.4, -ry * 0.8, rx * 1.8, ry * 1.6);
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || !W) return;
      const t = dt * 0.4; // slow motion
      acc += dt * rate;
      while (acc > 1) {
        spawn();
        acc -= 1;
      }
      const g = 150 * (Math.min(W, H) / 500);
      ctx.clearRect(0, 0, W, H);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vy += g * t;
        p.vx *= 1 - 0.2 * t;
        p.x += p.vx * t;
        p.y += p.vy * t;
        p.life += dt;
        if (p.life > p.max || p.y > H + 20) ps.splice(i, 1);
      }
      // far (defocused) drops first, then sharp ones on top — two passes, no per-frame sort
      for (let pass = 0; pass < 2; pass++) for (const p of ps) {
        if ((pass === 0) !== (p.depth > 0.5)) continue;
        const fadeIn = Math.min(1, p.life * 5);
        const fadeOut = Math.min(1, (p.max - p.life) * 1.2);
        draw(p, fadeIn * fadeOut);
      }
      ctx.globalAlpha = 1;
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
