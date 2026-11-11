/** Mutable, render-loop friendly state shared between DOM (GSAP/pointer) and R3F. */
export const sceneState = {
  pointer: { x: 0, y: 0 }, // normalised -1..1
  heroProgress: 0, // 0 → 1 while hero scrolls out
  splash: 0, // timestamp of last manual splash trigger
  ready: false, // set when the intro loader lifts
};
