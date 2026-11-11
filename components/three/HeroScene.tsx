"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Sparkles } from "@react-three/drei";
import CoffeeCup, { Saucer } from "./CoffeeCup";
import FloatingBeans from "./FloatingBeans";
import Steam from "./Steam";
import Droplets, { type DropletsHandle } from "./Droplets";
import DroppingBeans from "./DroppingBeans";
import FacetedCup, { MILK_START, facetLiquidHeight } from "./FacetedCup";
import PourStream, { type PourState } from "./PourStream";
import { CUP, cupRadiusAt } from "@/lib/geometry";
import { sceneState } from "@/lib/sceneState";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = THREE.MathUtils.lerp;

/**
 * Hero choreography, driven by `sceneState.heroProgress` (0→1 while the hero is pinned):
 *  0.00–0.10  beans keep dropping into cup 1, crown splashes
 *  0.00–0.35  text fades, cup 1 turns + lifts off its saucer, cup 2 rises into view
 *  0.30–0.55  cup 1 tilts; a stream of coffee pours into cup 2
 *  0.45–0.92  cup 1 empties while cup 2 fills, droplets splash at the impact point
 *  0.88–1.00  pour stops, steam rises from the full cup 2
 */
function Rig({ mobile }: { mobile: boolean }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const saucer1 = useRef<THREE.Group>(null);
  const cup2 = useRef<THREE.Group>(null);
  const droplets = useRef<DropletsHandle>(null);
  const intro = useRef(0);
  const fill1 = useRef(1);
  const fill2 = useRef(0);
  const mix2 = useRef(0);
  const steam1 = useRef(1);
  const steam2 = useRef(0);
  const beansActive = useRef(true);
  const lastCrown = useRef(1.5);
  const lastClick = useRef(0);
  const pour = useMemo<PourState>(() => ({ lip: new THREE.Vector3(), target: new THREE.Vector3(), amount: 0, scale: 1 }), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const lipLocal = useMemo(() => new THREE.Vector3(-(cupRadiusAt(CUP.height) - CUP.wall / 2), CUP.height + 0.01, 0), []);
  const { camera } = useThree();

  const S = mobile ? 0.66 : 0.92;
  const HOME = mobile ? { x: 0, y: -0.95 } : { x: 1.75, y: -0.45 };
  const POUR = mobile ? { x: -0.5, y: 1.05 } : { x: -0.85, y: 0.6 };
  const CUP2 = mobile ? { x: 0.45, y: -2.15 } : { x: 0.9, y: -2.75 };

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const { pointer, heroProgress: p } = sceneState;
    if (sceneState.ready) intro.current = Math.min(1, intro.current + Math.min(dt, 0.05) * 0.5);
    const e = 1 - Math.pow(1 - intro.current, 3);

    const move = smooth(0.0, 0.35, p);
    const rise2 = smooth(0.1, 0.38, p);
    const tilt = smooth(0.3, 0.55, p) * 1.22 - smooth(0.9, 1.0, p) * 0.35;
    const flow = smooth(0.42, 0.52, p) * (1 - smooth(0.86, 0.94, p));
    const wobble = 1 - move;

    fill1.current = 1 - smooth(0.4, 0.8, p);
    fill2.current = smooth(0.47, 0.92, p);
    mix2.current = smooth(0.5, 0.88, p);
    steam1.current = 1 - smooth(0.0, 0.2, p);
    steam2.current = smooth(0.85, 1.0, p);
    beansActive.current = p < 0.3;

    const o = outer.current;
    const i = inner.current;
    const c2 = cup2.current;
    if (!o || !i || !c2) return;

    // cup 1 — outer: travel + turn handle away; inner: lift + tilt
    const k = 0.1;
    o.position.x = mix(o.position.x, mix(HOME.x, POUR.x, move), k);
    o.position.y = mix(o.position.y, mix(HOME.y, POUR.y, move) + Math.sin(t * 0.8) * 0.06 * wobble - (1 - e) * 1.2, k);
    o.rotation.y = mix(o.rotation.y, mix(0.45 + pointer.x * 0.45 + (1 - e) * -1.6, Math.PI + pointer.x * 0.12, move), 0.08);
    o.rotation.x = mix(o.rotation.x, mix(0.12 - pointer.y * 0.18, 0.05, move), 0.08);
    o.rotation.z = mix(o.rotation.z, (Math.sin(t * 0.5) * 0.03 - pointer.x * 0.05) * wobble, 0.08);
    o.scale.setScalar(mix(0.6, 1, e) * S);
    i.position.y = mix(i.position.y, move * 0.55, k);
    i.rotation.z = mix(i.rotation.z, tilt, k);
    if (saucer1.current) {
      const sc = Math.max(0.001, 1 - smooth(0.05, 0.3, p));
      saucer1.current.scale.setScalar(sc);
      saucer1.current.visible = sc > 0.01;
    }

    // cup 2 rises from below
    c2.position.set(CUP2.x, mix(CUP2.y - 4, CUP2.y, rise2), 0);
    // slow showcase spin so the facets catch the light, plus a gentle float
    c2.rotation.set(0.24, t * 0.35 + pointer.x * 0.2, 0);
    c2.position.y += Math.sin(t * 1.1) * 0.04 * rise2;
    c2.scale.setScalar(S);
    c2.visible = rise2 > 0.001;

    // world-space pour geometry
    i.updateWorldMatrix(true, false);
    pour.lip.copy(lipLocal);
    i.localToWorld(pour.lip);
    const surfaceY = c2.position.y + facetLiquidHeight(MILK_START + (1 - MILK_START) * fill2.current) * S;
    pour.target.set(
      THREE.MathUtils.clamp(pour.lip.x + 0.12 * S, c2.position.x - 0.35 * S, c2.position.x + 0.35 * S),
      surfaceY,
      c2.position.z + 0.05,
    );
    pour.amount = flow;
    pour.scale = S;

    // splashes where the stream lands
    if (flow > 0.3 && droplets.current && Math.random() < 0.7) {
      droplets.current.burst(pour.target, { count: 2, up: [0.6, 1.3], out: [0.1, 0.4], size: [0.008 * S * 1.6, 0.02 * S * 1.6], floor: surfaceY - 0.04 });
    }

    // crown splash on a slow loop (and on click) while cup 1 rests
    const crown = (strength: number) => {
      if (!droplets.current) return;
      tmp.set(0, CUP.liquidY + 0.02, 0);
      i.localToWorld(tmp);
      droplets.current.burst(tmp, { count: Math.round(40 * strength), ring: 0.62 * S, up: [1.8, 3.0], out: [0.5, 1.2], size: [0.012, 0.03], floor: tmp.y - 0.1 });
    };
    if (p < 0.05 && t - lastCrown.current > 7) {
      lastCrown.current = t;
      crown(mobile ? 0.7 : 1);
    }
    if (sceneState.splash !== lastClick.current) {
      lastClick.current = sceneState.splash;
      if (p < 0.3) crown(1);
    }

    // camera pulls back and down to frame both cups
    const cam = smooth(0.05, 0.4, p);
    camera.position.x = mix(camera.position.x, pointer.x * 0.35 * (1 - cam * 0.6), 0.04);
    camera.position.y = mix(camera.position.y, mix(1.1, 0.4, cam) + pointer.y * 0.2, 0.05);
    camera.position.z = mix(camera.position.z, mix(8.2, mobile ? 11 : 11.2, cam), 0.06);
    camera.lookAt(0, mix(0.6, mobile ? -0.45 : -0.1, cam), 0);
  });

  const onImpact = (pos: THREE.Vector3) =>
    droplets.current?.burst(pos, { count: mobile ? 10 : 16, up: [1.1, 2.1], out: [0.25, 0.8], size: [0.01, 0.024], floor: pos.y - 0.05 });

  return (
    <>
      <group ref={outer} position={[HOME.x, -2, 0]}>
        <group ref={saucer1}>
          <Saucer />
          <ContactShadows position={[0, -0.1, 0]} opacity={0.6} scale={6} blur={2.6} far={2} color="#000000" />
        </group>
        <group ref={inner}>
          <group
            onClick={(ev) => {
              ev.stopPropagation();
              sceneState.splash = performance.now();
            }}
            onPointerOver={() => (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "")}
          >
            <CoffeeCup fillRef={fill1} withSaucer={false} />
          </group>
          <DroppingBeans count={mobile ? 5 : 7} activeRef={beansActive} onImpact={onImpact} />
          <group position={[0, CUP.liquidY + 0.05, 0]}>
            <Steam strengthRef={steam1} />
          </group>
        </group>
      </group>

      <group ref={cup2} visible={false}>
        <FacetedCup fillRef={fill2} mixRef={mix2} />
        {/* side glints so the diamond facets read */}
        <pointLight position={[2.2, 1.6, 1.8]} intensity={9} distance={7} color="#ffd9a8" />
        <pointLight position={[-2.4, 0.8, 1.2]} intensity={4} distance={6} color="#c49a62" />
        <group position={[0, CUP.liquidY + 0.05, 0]}>
          <Steam strengthRef={steam2} />
        </group>
        <ContactShadows position={[0, -0.1, 0]} opacity={0.6} scale={6} blur={2.6} far={2} color="#000000" />
      </group>

      <PourStream state={pour} />
      <Droplets ref={droplets} pool={mobile ? 120 : 200} />
    </>
  );
}

/** Volumetric-looking light shaft from top-left. */
function LightShaft() {
  return (
    <mesh position={[-3.2, 2.6, -3]} rotation={[0, 0, -0.62]}>
      <planeGeometry args={[2.6, 12]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
        fragmentShader={`varying vec2 vUv; void main(){ float x=1.0-abs(vUv.x-0.5)*2.0; float a=pow(x,2.4)*smoothstep(0.0,0.7,vUv.y)*0.16; gl_FragColor=vec4(0.86,0.66,0.42,a);} `}
      />
    </mesh>
  );
}

export default function HeroScene({ mobile, reduced }: { mobile: boolean; reduced: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // pause rendering when the hero is off-screen
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? (reduced ? "demand" : "always") : "never"}
        dpr={mobile ? [1, 1.5] : [1, 1.8]}
        camera={{ position: [0, 1.1, 8.2], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        shadows={false}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.15} />
          <spotLight position={[-5, 7, 4]} angle={0.45} penumbra={1} intensity={120} color="#ffd5a1" />
          <pointLight position={[4, 2.5, -3]} intensity={30} color="#c49a62" />
          <pointLight position={[-3, -1, 3]} intensity={6} color="#6f4228" />
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={3} position={[-4, 5, 2]} scale={[6, 2, 1]} color="#ffe2bd" />
            <Lightformer form="rect" intensity={2} position={[5, 1, -2]} scale={[2, 6, 1]} color="#c49a62" />
            <Lightformer form="ring" intensity={1.2} position={[0, 4, 6]} scale={3} color="#f2e6d5" />
          </Environment>
          <LightShaft />
          <Rig mobile={mobile} />
          <FloatingBeans count={mobile ? 16 : 30} spread={mobile ? 0.7 : 1} offsetX={mobile ? 0 : 1.6} />
          <Sparkles count={mobile ? 30 : 80} scale={[12, 7, 6]} size={2.2} speed={0.25} opacity={0.6} color="#c49a62" />
        </Suspense>
      </Canvas>
    </div>
  );
}
