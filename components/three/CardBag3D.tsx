"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import CoffeeBag from "./CoffeeBag";
import type { Product } from "@/lib/products";

function Turning({ product, speed, offset }: { product: Product; speed: number; offset: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.rotation.y = offset + t * speed;
    g.current.position.y = Math.sin(t * 1.1 + offset) * 0.05;
  });
  return (
    <group ref={g}>
      <CoffeeBag product={product} />
    </group>
  );
}

/**
 * A real 3D stand-up pouch (pinched, sealed top + pillowed body) for a product card.
 * The WebGL canvas only exists while the card is on screen, so many cards stay cheap.
 */
export default function CardBag3D({ product, speed = 0.55, offset = 0, fast = false }: { product: Product; speed?: number; offset?: number; fast?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setMounted(e.isIntersecting), { rootMargin: "200px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="h-full w-full" role="img" aria-label={`${product.name} coffee pouch, rotating`}>
      {mounted && (
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.25, 5.4], fov: 30 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.45} />
            <spotLight position={[-3, 5, 4]} angle={0.6} penumbra={1} intensity={80} color="#fff0dc" />
            {/* rim lights keep the dark pouches readable when they turn edge-on */}
            <pointLight position={[3, 1, -2]} intensity={28} color="#e0b07a" />
            <pointLight position={[-3, 0, -2]} intensity={18} color="#c49a62" />
            <pointLight position={[0, -1, 3]} intensity={6} color="#ffd9b0" />
            <Environment resolution={64} frames={1}>
              <Lightformer form="rect" intensity={4} position={[-2, 3, 3]} scale={[4, 3, 1]} color="#fff2de" />
              <Lightformer form="rect" intensity={3} position={[3, 0, -1]} scale={[1, 5, 1]} color="#e3b57e" />
              <Lightformer form="rect" intensity={3} position={[-3, 0, -1]} scale={[1, 5, 1]} color="#e3b57e" />
            </Environment>
            <Turning product={product} speed={fast ? speed * 1.6 : speed} offset={offset} />
            <ContactShadows frames={1} resolution={256} position={[0, -1.2, 0]} opacity={0.65} scale={4} blur={2.4} far={2} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
