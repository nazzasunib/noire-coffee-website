"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import FacetedCup from "./FacetedCup";
import Steam from "./Steam";
import { CUP } from "@/lib/geometry";

/** The Story section's hero cup, live: a slowly turning faceted espresso cup with rising steam. */
function TurningCup() {
  const g = useRef<THREE.Group>(null);
  const full = useRef(1);
  const mix = useRef(1);
  const steam = useRef(1);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.rotation.y = t * 0.3;
    g.current.position.y = -0.85 + Math.sin(t * 0.9) * 0.03;
  });
  return (
    <group ref={g} position={[0.15, -0.85, 0]} scale={0.78}>
      <FacetedCup fillRef={full} mixRef={mix} />
      <group position={[0, CUP.liquidY, 0]}>
        <Steam strengthRef={steam} />
      </group>
    </group>
  );
}

function Aim() {
  const { camera } = useThree();
  useEffect(() => camera.lookAt(0, -0.1, 0), [camera]);
  return null;
}

/** Soft beam of morning light, like the original photo. */
function Beam() {
  return (
    <mesh position={[-1.6, 2.2, -2]} rotation={[0, 0, -0.75]}>
      <planeGeometry args={[2.4, 9]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
        fragmentShader={`varying vec2 vUv; void main(){ float x=1.0-abs(vUv.x-0.5)*2.0; float a=pow(x,2.0)*smoothstep(0.0,0.8,vUv.y)*0.28; gl_FragColor=vec4(0.95,0.75,0.52,a);} `}
      />
    </mesh>
  );
}

export default function StoryCupScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "150px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_20%_15%,#8a6a50_0%,#3a2a20_45%,#140e0b_100%)]">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.3, 8.6], fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <spotLight position={[-4, 6, 3]} angle={0.5} penumbra={1} intensity={90} color="#ffe0b8" />
          <pointLight position={[3, 1.5, 2]} intensity={12} color="#ffcf98" />
          <pointLight position={[-2, 0.5, 2.5]} intensity={5} color="#c49a62" />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={3} position={[-3, 4, 2]} scale={[5, 2, 1]} color="#ffe6c8" />
            <Lightformer form="rect" intensity={1.5} position={[4, 1, 1]} scale={[1, 4, 1]} color="#c49a62" />
          </Environment>
          <Aim />
          <Beam />
          <TurningCup />
          {/* table top */}
          <mesh position={[0, -0.93, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[6, 48]} />
            <meshStandardMaterial color="#2a1d16" roughness={0.75} />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}
