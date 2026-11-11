"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import CoffeeCup, { Saucer } from "./CoffeeCup";
import Steam from "./Steam";
import { CUP } from "@/lib/geometry";

type Floater = { kind: "cup" | "saucer"; pos: [number, number, number]; rot: [number, number, number]; spin: [number, number, number]; amp: number; speed: number; phase: number; scale: number };

const FLOATERS: Floater[] = [
  { kind: "cup", pos: [-1.6, 1.9, -1.2], rot: [2.6, 0.4, 0.3], spin: [0.12, 0.18, 0.05], amp: 0.22, speed: 0.45, phase: 0, scale: 0.55 },
  { kind: "saucer", pos: [-0.9, 1.0, -0.6], rot: [0.5, 0.2, 0.35], spin: [0.06, 0.1, 0.08], amp: 0.18, speed: 0.38, phase: 1.3, scale: 0.6 },
  { kind: "cup", pos: [0.3, 1.25, 0.2], rot: [1.9, -0.6, 1.3], spin: [-0.15, 0.1, 0.12], amp: 0.2, speed: 0.5, phase: 2.1, scale: 0.5 },
  { kind: "cup", pos: [1.7, 1.7, -1.5], rot: [-0.8, 0.9, 2.4], spin: [0.08, -0.16, 0.06], amp: 0.25, speed: 0.4, phase: 3.4, scale: 0.42 },
  { kind: "saucer", pos: [1.9, 2.6, -2.2], rot: [1.2, 0, -0.6], spin: [0.1, 0.05, -0.07], amp: 0.2, speed: 0.35, phase: 4.2, scale: 0.55 },
  { kind: "saucer", pos: [-2.1, 0.2, -1.8], rot: [-0.9, 0.3, 0.2], spin: [-0.07, 0.12, 0.05], amp: 0.15, speed: 0.42, phase: 5.1, scale: 0.45 },
  { kind: "cup", pos: [-0.2, 2.9, -2.6], rot: [0.3, 2.2, -2.8], spin: [0.1, 0.08, -0.1], amp: 0.2, speed: 0.33, phase: 0.7, scale: 0.4 },
];

/** One weightless cup or saucer: slow tumble plus a gentle drifting bob. */
function Drifter({ f }: { f: Floater }) {
  const g = useRef<THREE.Group>(null);
  const empty = useRef(0);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.position.set(
      f.pos[0] + Math.sin(t * f.speed * 0.7 + f.phase) * f.amp * 0.6,
      f.pos[1] + Math.sin(t * f.speed + f.phase) * f.amp,
      f.pos[2] + Math.cos(t * f.speed * 0.5 + f.phase) * f.amp * 0.5,
    );
    g.current.rotation.set(f.rot[0] + t * f.spin[0], f.rot[1] + t * f.spin[1], f.rot[2] + t * f.spin[2]);
  });
  return (
    <group ref={g} scale={f.scale}>
      {f.kind === "cup" ? <CoffeeCup fillRef={empty} withSaucer={false} /> : <Saucer />}
    </group>
  );
}

/** The grounded hero cup: full, steaming, barely hovering. */
function HeroCup() {
  const g = useRef<THREE.Group>(null);
  const full = useRef(1);
  const steam = useRef(1);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.position.y = -1.55 + Math.sin(t * 0.6) * 0.05;
    g.current.rotation.y = 0.5 + Math.sin(t * 0.25) * 0.25;
  });
  return (
    <group ref={g} position={[0.35, -1.55, 0.6]} scale={0.8}>
      <CoffeeCup fillRef={full} />
      <group position={[0, CUP.liquidY + 0.05, 0]}>
        <Steam strengthRef={steam} />
      </group>
    </group>
  );
}

export default function FloatingCupsScene({ active = true }: { active?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "150px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  const floaters = useMemo(() => FLOATERS, []);

  return (
    <div ref={wrap} className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_70%,#2b2420_0%,#151110_55%,#0b0908_100%)]">
      <Canvas
        frameloop={visible && active ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.6, 7.2], fov: 38 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.25} />
          <spotLight position={[3, 6, 4]} angle={0.6} penumbra={1} intensity={70} color="#ffd9b0" />
          <pointLight position={[-3, -1, 3]} intensity={10} color="#c49a62" />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={3} position={[3, 4, 3]} scale={[4, 2, 1]} color="#ffe2c4" />
            <Lightformer form="rect" intensity={1.5} position={[-4, 0, 2]} scale={[1, 4, 1]} color="#c49a62" />
          </Environment>
          {floaters.map((f, i) => (
            <Drifter key={i} f={f} />
          ))}
          <HeroCup />
          <Sparkles count={50} scale={[8, 6, 4]} size={1.6} speed={0.15} opacity={0.5} color="#c49a62" />
        </Suspense>
      </Canvas>
    </div>
  );
}
