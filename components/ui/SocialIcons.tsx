// Simple generic glyphs (lucide dropped brand icons). Stroke style matches lucide.
const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const Instagram = () => (
  <svg {...base}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
);
export const Facebook = () => (
  <svg {...base}><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" /></svg>
);
export const XLogo = () => (
  <svg {...base}><path d="M4 4l16 16M20 4L4 20" /></svg>
);
export const Pinterest = () => (
  <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M10.5 20l1.8-7.5M12 8.5a3 3 0 0 1 3 3c0 2-1.2 3.5-2.6 3.5-.9 0-1.6-.6-1.4-1.5" /></svg>
);
