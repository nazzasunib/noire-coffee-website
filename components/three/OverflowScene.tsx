"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import CoffeeCup, { liquidHeight } from "./CoffeeCup";
import Droplets, { type DropletsHandle } from "./Droplets";
import PourStream, { type PourState } from "./PourStream";
import { CUP, cupRadiusAt } from "@/lib/geometry";

const SLOW = 0.45; // slow-motion time scale
const FULL = (CUP.height + 0.005 - 0.2) / (CUP.liquidY - 0.2); // fill level that reaches the rim
const CUP_TURN = 1.0; // handle turned away from the viewer
const T_POUR = 0.8;
const T_FULL = 8.5;

/** Height of the saucer's top surface at radius r (cup-group local). */
function saucerTop(r: number) {
  const pts: [number, number][] = [[0, 0], [0.74, 0], [0.92, 0], [1.38, 0.05], [1.62, 0.135], [1.7, 0.14]];
  for (let i = 1; i < pts.length; i++) {
    if (r <= pts[i][0]) {
      const [r0, y0] = pts[i - 1];
      const [r1, y1] = pts[i];
      return y0 + ((r - r0) / (r1 - r0)) * (y1 - y0);
    }
  }
  return 0.14;
}

function useFlowTexture() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 128;
    cv.height = 16;
    const ctx = cv.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 16);
    g.addColorStop(0, "#2a1208");
    g.addColorStop(0.5, "#8a4a1e");
    g.addColorStop(1, "#2a1208");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 16);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(235,175,115,${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * 128, Math.random() * 16, 10 + Math.random() * 30, 1);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);
}

/** Coffee running down the outside of the cup and onto the saucer, growing slowly. */
function Rivulets({ clock }: { clock: { current: number } }) {
  const tex = useFlowTexture();
  const defs = useMemo(
    () =>
      [-0.45, -0.05, 0.35, -0.85, 0.7, -1.2].map((off, i) => ({
        a: -CUP_TURN + off,
        delay: i * 0.9,
        r: 0.026 + (i % 3) * 0.006,
        wobble: Math.random() * 6,
      })),
    [],
  );
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  const pathFor = (a: number, wobble: number, progress: number) => {
    const pts: THREE.Vector3[] = [];
    const steps = 18;
    const n = Math.max(2, Math.ceil(steps * progress));
    for (let k = 0; k <= n; k++) {
      const u = Math.min(1, k / steps);
      let x: number, y: number, z: number;
      if (u < 0.82) {
        // down the outer wall
        const y0 = CUP.height + 0.02 - (u / 0.82) * (CUP.height - 0.06);
        const rr = cupRadiusAt(y0) + 0.018;
        const aa = a + Math.sin(u * 6 + wobble) * 0.04;
        x = Math.sin(aa) * rr;
        z = Math.cos(aa) * rr;
        y = y0;
      } else {
        // out across the saucer
        const v = (u - 0.82) / 0.18;
        const rr = 0.56 + v * 0.42;
        x = Math.sin(a) * rr;
        z = Math.cos(a) * rr;
        y = saucerTop(rr) + 0.015;
      }
      pts.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(pts);
  };

  useFrame((_, dt) => {
    tex.offset.x -= dt * 0.6;
    const since = clock.current - T_FULL;
    defs.forEach((d, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const p = Math.min(1, Math.max(0, (since - d.delay) / 4.5));
      m.visible = p > 0.02;
      if (!m.visible) return;
      const geo = new THREE.TubeGeometry(pathFor(d.a, d.wobble, p), 32, d.r, 8, false);
      m.geometry.dispose();
      m.geometry = geo;
    });
  });

  return (
    <group>
      {defs.map((_, i) => (
        <mesh key={i} ref={(el) => (meshes.current[i] = el)} visible={false}>
          <bufferGeometry />
          <meshPhysicalMaterial map={tex} roughness={0.12} clearcoat={1} emissive="#2a1206" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Coffee pooling on the saucer, spreading outwards over time. */
function Puddle({ clock }: { clock: { current: number } }) {
  const mesh = useRef<THREE.Mesh>(null);
  const last = useRef(-1);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const p = Math.min(1, Math.max(0, (clock.current - T_FULL - 2.5) / 14));
    m.visible = p > 0.01;
    if (!m.visible || Math.abs(p - last.current) < 0.01) return;
    last.current = p;
    const outer = 0.55 + p * 1.0;
    const pts: THREE.Vector2[] = [];
    for (let k = 0; k <= 16; k++) {
      const r = 0.5 + (k / 16) * (outer - 0.5);
      pts.push(new THREE.Vector2(r, saucerTop(r) + 0.012));
    }
    const geo = new THREE.LatheGeometry(pts, 64);
    m.geometry.dispose();
    m.geometry = geo;
  });
  return (
    <mesh ref={mesh} visible={false} position={[0, -0.1 + 0.1, 0]}>
      <bufferGeometry />
      <meshPhysicalMaterial color="#3a1a0a" roughness={0.08} clearcoat={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Rig({ mobile }: { mobile: boolean }) {
  const cup = useRef<THREE.Group>(null);
  const fill = useRef(0.2);
  const clock = useRef(0);
  const drops = useRef<DropletsHandle>(null);
  const pour = useMemo<PourState>(() => ({ lip: new THREE.Vector3(), target: new THREE.Vector3(), amount: 0, scale: 1 }), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  const S = mobile ? 0.8 : 1.05;
  const POS = mobile ? new THREE.Vector3(0.25, -1.9, 0) : new THREE.Vector3(1.75, -1.25, 0);

  useEffect(() => camera.lookAt(mobile ? 0 : 0.6, mobile ? -0.8 : -0.35, 0), [camera, mobile]);

  useFrame((s, dt) => {
    const g = cup.current;
    if (!g) return;
    clock.current += Math.min(dt, 0.25);
    const t = clock.current;

    g.position.copy(POS);
    g.scale.setScalar(S);
    g.rotation.y = CUP_TURN + Math.sin(s.clock.elapsedTime * 0.2) * 0.06;

    // fill rises in slow motion, then holds at the brim
    const k = Math.min(1, Math.max(0, (t - T_POUR) / (T_FULL - T_POUR)));
    fill.current = 0.2 + (FULL - 0.2) * (1 - Math.pow(1 - k, 1.6));
    const surfaceY = POS.y + liquidHeight(fill.current) * S;

    // stream comes in from the upper right
    pour.amount = Math.min(1, Math.max(0, (t - 0.1) / 0.7));
    pour.scale = S * 1.3;
    pour.lip.set(POS.x + 2.4 * S, POS.y + 4.2 * S, 0.3);
    pour.target.set(POS.x + 0.12 * S, surfaceY, 0.05);

    if (!drops.current) return;
    // splashes where the stream lands
    if (pour.amount > 0.5 && Math.random() < 0.6) {
      drops.current.burst(pour.target, { count: 2, up: [0.8, 1.6], out: [0.2, 0.6], size: [0.012 * S, 0.026 * S], floor: surfaceY - 0.05 });
    }
    // overflow: drops tumble over the front of the rim
    if (t > T_FULL - 0.3 && Math.random() < 0.55) {
      const a = -CUP_TURN + (Math.random() - 0.5) * 2.6 + g.rotation.y;
      const r = cupRadiusAt(CUP.height) * S;
      tmp.set(POS.x + Math.sin(a) * r, POS.y + (CUP.height + 0.02) * S, Math.cos(a) * r);
      drops.current.burst(tmp, { count: 1, up: [0.05, 0.4], out: [0.15, 0.45], size: [0.018 * S, 0.034 * S], floor: POS.y + 0.02 * S });
    }
  });

  return (
    <>
      <group ref={cup}>
        <CoffeeCup fillRef={fill} />
        <Rivulets clock={clock} />
        <Puddle clock={clock} />
      </group>
      <PourStream state={pour} flowSpeed={1.1} />
      <Droplets ref={drops} pool={mobile ? 120 : 200} timeScale={SLOW} />
    </>
  );
}

/** "Made for the moments": coffee pours in from the side, fills the cup and spills over in slow motion. */
export default function OverflowScene({ mobile }: { mobile: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={mobile ? [1, 1.5] : [1, 1.8]}
        camera={{ position: [0, 3.6, 8], fov: 34 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <spotLight position={[4, 7, 5]} angle={0.5} penumbra={1} intensity={130} color="#ffd8ae" />
          <pointLight position={[-3, 1, 3]} intensity={10} color="#c49a62" />
          <pointLight position={[3, -1, -2]} intensity={14} color="#ff9a4a" />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={3} position={[4, 5, 3]} scale={[5, 2, 1]} color="#ffe2c4" />
            <Lightformer form="rect" intensity={1.6} position={[-4, 1, 2]} scale={[1, 4, 1]} color="#c49a62" />
          </Environment>
          <Rig mobile={mobile} />
          <Sparkles count={mobile ? 30 : 60} scale={[12, 7, 5]} size={1.8} speed={0.12} opacity={0.5} color="#c49a62" />
        </Suspense>
      </Canvas>
    </div>
  );
}
