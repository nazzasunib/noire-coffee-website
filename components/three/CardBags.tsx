"use client";

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, View } from "@react-three/drei";
import CoffeeBag from "./CoffeeBag";
import type { Product } from "@/lib/products";

function Turning({ product, offset }: { product: Product; offset: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.rotation.y = offset + t * 0.55;
    g.current.position.y = Math.sin(t * 1.1 + offset) * 0.05;
  });
  return (
    <group ref={g}>
      <CoffeeBag product={product} />
    </group>
  );
}

/** One card's pouch. Drawn by the single shared <CardBagsCanvas>, not its own WebGL context. */
export function CardBagView({ product, offset = 0 }: { product: Product; offset?: number }) {
  return (
    <View className="h-full w-full">
      <ambientLight intensity={0.45} />
      <spotLight position={[-3, 5, 4]} angle={0.6} penumbra={1} intensity={80} color="#fff0dc" />
      <pointLight position={[3, 1, -2]} intensity={28} color="#e0b07a" />
      <pointLight position={[-3, 0, -2]} intensity={18} color="#c49a62" />
      <Environment resolution={32} frames={1}>
        <Lightformer form="rect" intensity={4} position={[-2, 3, 3]} scale={[4, 3, 1]} color="#fff2de" />
        <Lightformer form="rect" intensity={3} position={[3, 0, -1]} scale={[1, 5, 1]} color="#e3b57e" />
        <Lightformer form="rect" intensity={3} position={[-3, 0, -1]} scale={[1, 5, 1]} color="#e3b57e" />
      </Environment>
      <Suspense fallback={null}>
        <Turning product={product} offset={offset} />
      </Suspense>
      {/* soft floor shadow (static sprite — far cheaper than a live shadow pass) */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </View>
  );
}

/** A single fixed, transparent WebGL canvas that renders every card's pouch via scissored views. */
export default function CardBagsCanvas() {
  return (
    <Canvas
      className="!pointer-events-none !fixed !inset-0 !z-[5]"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.25, 5.4], fov: 30 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15, powerPreference: "high-performance" }}
    >
      <View.Port />
    </Canvas>
  );
}
