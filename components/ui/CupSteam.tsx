/**
 * Soft, looping steam that rises from a cup in a photo.
 * `x`/`y` = cup mouth centre (percent of the frame), `w` = mouth width (percent of frame width).
 * Pure CSS (blurred gradient wisps), so it costs almost nothing and respects reduced motion.
 */
export default function CupSteam({ x, y, w = 22, warm = false }: { x: number; y: number; w?: number; warm?: boolean }) {
  const wisps = [
    { left: 30, delay: 0, dur: 5.2, drift: -18, size: 1 },
    { left: 55, delay: 1.3, dur: 6.1, drift: 22, size: 0.9 },
    { left: 42, delay: 2.6, dur: 5.6, drift: -8, size: 1.15 },
    { left: 62, delay: 3.7, dur: 6.6, drift: 14, size: 0.8 },
    { left: 36, delay: 4.6, dur: 5.9, drift: 26, size: 0.95 },
  ];
  return (
    <div
      aria-hidden
      className={`cup-steam pointer-events-none absolute ${warm ? "is-warm" : ""}`}
      style={{ left: `${x - w / 2}%`, width: `${w}%`, bottom: `${100 - y}%`, height: `${Math.min(y, 70)}%` }}
    >
      {wisps.map((s, i) => (
        <span
          key={i}
          className="cup-steam-wisp"
          style={
            {
              left: `${s.left}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
              "--drift": `${s.drift}%`,
              "--size": s.size,
              "--tone": warm ? "245,225,205" : "242,234,222",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
