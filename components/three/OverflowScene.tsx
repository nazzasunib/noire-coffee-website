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

/** Overflow side, in cup-local angle (faces the camera, a little to the left). */
const SPILL_A = -CUP_TURN - 0.35;
const SPILL_SPAN = 1.5; // radians of rim the sheet spills over
const COLS = 36;
const ROWS = 46;
const RIM_R = cupRadiusAt(CUP.height);
const WALL_END = 1.3; // path length at which the flow leaves the wall and reaches the saucer

/** Point on the flow path, `s` = distance travelled from the rim. Hugs the wall, then runs onto the saucer. */
function flowPoint(theta: number, s: number, thick: number, out: THREE.Vector3) {
  let r: number, y: number;
  if (s < 0.06) {
    // curl over the lip
    const k = s / 0.06;
    r = RIM_R - 0.03 + k * 0.05 + thick;
    y = CUP.height + 0.025 - k * k * 0.03;
  } else if (s < WALL_END) {
    y = CUP.height - 0.005 - (s - 0.06) * ((CUP.height - 0.04) / (WALL_END - 0.06));
    r = cupRadiusAt(Math.max(0.04, y)) + thick;
  } else {
    r = cupRadiusAt(0.04) + (s - WALL_END) + thick * 0.3;
    y = saucerTop(r) + 0.004 + thick * 0.5;
  }
  out.set(Math.sin(theta) * r, y, Math.cos(theta) * r);
  return out;
}

function useStreakTexture() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 256;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#5a2a10";
    ctx.fillRect(0, 0, 64, 256);
    // long vertical streaks = liquid running down
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 64;
      const w = 0.6 + Math.random() * 2.2;
      const l = 30 + Math.random() * 160;
      const y = Math.random() * 256;
      const light = Math.random() > 0.55;
      ctx.fillStyle = light ? `rgba(200,120,55,${0.15 + Math.random() * 0.3})` : `rgba(25,10,3,${0.2 + Math.random() * 0.3})`;
      ctx.fillRect(x, y, w, l);
      ctx.fillRect(x, y - 256, w, l);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);
}

/**
 * The overflow: one continuous sheet of coffee spilling over the low side of the rim,
 * clinging to the wall and breaking into uneven fingers that taper as they run down,
 * then spreading onto the saucer. Grows in slow motion once the cup is full.
 */
function OverflowSheet({ clock }: { clock: { current: number } }) {
  const tex = useStreakTexture();
  const mesh = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = (COLS + 1) * (ROWS + 1);
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const idx: number[] = [];
    for (let v = 0; v < ROWS; v++)
      for (let u = 0; u < COLS; u++) {
        const a = v * (COLS + 1) + u;
        const b = a + 1;
        const c = a + COLS + 1;
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    g.setIndex(idx);
    return g;
  }, []);
  // each column gets its own finger length + speed, so the front is ragged like real liquid
  const cols = useMemo(
    () =>
      Array.from({ length: COLS + 1 }, (_, u) => {
        const x = u / COLS;
        const edge = Math.pow(Math.sin(Math.PI * x), 0.7); // shorter at the sheet's edges
        const finger = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(x * 11 + 1.3)), 1.4);
        return { reach: edge * finger, lag: Math.random() * 0.6, wander: Math.random() * 6 };
      }),
    [],
  );
  const p = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(-1);

  useEffect(() => () => {
    geo.dispose();
    tex.dispose();
  }, [geo, tex]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    tex.offset.y += dt * 0.12; // streaks keep sliding down
    const since = clock.current - T_FULL + 0.4;
    m.visible = since > 0;
    if (!m.visible) return;
    if (Math.abs(since - last.current) < 0.03) return;
    last.current = since;

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    // sheet widens a little over time as more of the rim brims over
    const widen = Math.min(1, 0.35 + since * 0.12);
    for (let u = 0; u <= COLS; u++) {
      const c = cols[u];
      const x = u / COLS;
      // slow motion: the front creeps down, easing out as it reaches the saucer
      const grow = Math.max(0, since - c.lag);
      const L = c.reach * (WALL_END + 0.55) * (1 - Math.exp(-grow / 6));
      for (let v = 0; v <= ROWS; v++) {
        const k = v / ROWS;
        const s = k * L;
        // fingers narrow toward their tips: pull columns toward their neighbours' centre line
        const taper = 1 - Math.pow(k, 2.2) * 0.15;
        const theta = SPILL_A + (x - 0.5) * SPILL_SPAN * widen * taper + Math.sin(s * 3 + c.wander) * 0.015;
        // thick bead at the leading edge, thin film behind it
        const thick = 0.006 + 0.012 * (1 - k) + (k > 0.85 ? 0.012 * Math.sin(((k - 0.85) / 0.15) * Math.PI) : 0);
        flowPoint(theta, s, L > 0.001 ? thick : 0, p);
        const i = v * (COLS + 1) + u;
        pos.setXYZ(i, p.x, p.y, p.z);
        uv.setXY(i, x * 1.5, s * 1.6);
      }
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  });

  return (
    <mesh ref={mesh} geometry={geo} visible={false}>
      <meshPhysicalMaterial
        map={tex}
        color="#d0905a"
        roughness={0.04}
        clearcoat={1}
        clearcoatRoughness={0.02}
        transparent
        opacity={0.94}
        side={THREE.DoubleSide}
        emissive="#3a1806"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

/** Coffee spreading across the saucer from the spill side: an irregular, glossy pool. */
function Puddle({ clock }: { clock: { current: number } }) {
  const mesh = useRef<THREE.Mesh>(null);
  const SEG = 72;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
    const idx: number[] = [];
    for (let i = 1; i < SEG; i++) idx.push(0, i, i + 1);
    idx.push(0, SEG, 1);
    g.setIndex(idx);
    return g;
  }, []);
  const noise = useMemo(() => Array.from({ length: SEG }, () => 0.75 + Math.random() * 0.5), []);
  const last = useRef(-1);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const since = clock.current - T_FULL - 2.2;
    m.visible = since > 0;
    if (!m.visible || Math.abs(since - last.current) < 0.05) return;
    last.current = since;
    const p = 1 - Math.exp(-since / 9);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, 0, 0.005, 0);
    const base = cupRadiusAt(0.04) - 0.02;
    for (let i = 0; i < SEG; i++) {
      const th = (i / SEG) * Math.PI * 2;
      // pool is strongest on the spill side and wraps round the foot more slowly
      let d = Math.atan2(Math.sin(th - SPILL_A), Math.cos(th - SPILL_A));
      const lobe = Math.exp(-(d * d) / (0.9 + p * 1.6));
      const smoothN = (noise[i] + noise[(i + 1) % SEG] + noise[(i + SEG - 1) % SEG]) / 3;
      const r = Math.min(1.5, base + p * (0.15 + 0.95 * lobe) * smoothN);
      const y = saucerTop(r) + 0.006 * (1 - r / 1.6) + 0.003;
      pos.setXYZ(i + 1, Math.sin(th) * r, y, Math.cos(th) * r);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  });

  return (
    <mesh ref={mesh} geometry={geo} visible={false}>
      <meshPhysicalMaterial color="#5a2a10" emissive="#1e0b03" roughness={0.03} clearcoat={1} clearcoatRoughness={0.02} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Rig({ mobile }: { mobile: boolean }) {
  const cup = useRef<THREE.Group>(null);
  const fill = useRef(0.2);
  const clock = useRef(0);
  const drops = useRef<DropletsHandle>(null);
  const pour = useMemo<PourState>(() => ({ lip: new THREE.Vector3(), target: new THREE.Vector3(), amount: 0, scale: 1 }), []);
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
    if (pour.amount > 0.5 && Math.random() < 0.3) {
      drops.current.burst(pour.target, { count: 1, up: [0.6, 1.2], out: [0.15, 0.45], size: [0.006 * S, 0.014 * S], floor: surfaceY - 0.02 });
    }
  });

  return (
    <>
      <group ref={cup}>
        <CoffeeCup fillRef={fill} />
        <OverflowSheet clock={clock} />
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
