"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Sparkles } from "@react-three/drei";
import CoffeeCup from "./CoffeeCup";
import FloatingBeans from "./FloatingBeans";
import Steam from "./Steam";
import Splash from "./Splash";
import { CUP } from "@/lib/geometry";
import { sceneState } from "@/lib/sceneState";

function Rig({ mobile }: { mobile: boolean }) {
  const cup = useRef<THREE.Group>(null);
  const intro = useRef(0);
  const { camera } = useThree();

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const { pointer, heroProgress: p } = sceneState;
    if (sceneState.ready) intro.current = Math.min(1, intro.current + Math.min(dt, 0.05) * 0.5);
    const e = 1 - Math.pow(1 - intro.current, 3); // easeOutCubic intro

    if (cup.current) {
      const g = cup.current;
      const baseX = mobile ? 0 : 1.75;
      const baseY = mobile ? -0.95 : -0.45;
      g.position.x = THREE.MathUtils.lerp(g.position.x, baseX - p * (mobile ? 0 : 0.9), 0.08);
      g.position.y = THREE.MathUtils.lerp(g.position.y, baseY + Math.sin(t * 0.8) * 0.06 - (1 - e) * 1.2 + p * 1.4, 0.08);
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, 0.45 + pointer.x * 0.45 + (1 - e) * -1.6 + p * 1.2, 0.06);
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.12 - pointer.y * 0.18 + p * 0.5, 0.06);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, Math.sin(t * 0.5) * 0.03 - pointer.x * 0.05, 0.06);
      g.scale.setScalar(THREE.MathUtils.lerp(0.6, 1, e) * (1 - p * 0.15) * (mobile ? 0.66 : 0.92));
    }
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.35, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.1 + pointer.y * 0.2, 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 8.2 + p * 1.8, 0.06);
    camera.lookAt(0, 0.6, 0);
  });

  return (
    <group ref={cup} position={[mobile ? 0 : 1.55, -2, 0]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          sceneState.splash = performance.now();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <CoffeeCup />
      </group>
      <group position={[0, CUP.liquidY + 0.05, 0]}>
        <Steam />
      </group>
      <Splash count={mobile ? 36 : 56} />
      <ContactShadows position={[0, -0.1, 0]} opacity={0.6} scale={6} blur={2.6} far={2} color="#000000" />
    </group>
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
