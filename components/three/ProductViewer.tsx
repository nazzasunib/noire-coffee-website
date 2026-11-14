"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, OrbitControls } from "@react-three/drei";
import CoffeeBag from "./CoffeeBag";
import { products } from "@/lib/products";

/** Spins the outgoing bag away and the incoming one in when the product changes. */
function SwappingBag({ productId }: { productId: string }) {
  const [shown, setShown] = useState(productId);
  const group = useRef<THREE.Group>(null);
  const anim = useRef({ phase: "idle" as "idle" | "out" | "in", t: 0 });

  useEffect(() => {
    if (productId !== shown) anim.current = { phase: "out", t: 0 };
  }, [productId, shown]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const a = anim.current;
    if (a.phase === "out") {
      a.t = Math.min(1, a.t + dt * 3.2);
      const e = a.t * a.t;
      g.scale.setScalar(1 - e * 0.85);
      g.rotation.y += dt * 9 * (1 - e * 0.5);
      if (a.t >= 1) {
        setShown(productId);
        anim.current = { phase: "in", t: 0 };
      }
    } else if (a.phase === "in") {
      a.t = Math.min(1, a.t + dt * 2.2);
      const e = 1 - Math.pow(1 - a.t, 3);
      g.scale.setScalar(0.15 + e * 0.85);
      g.rotation.y += dt * 6 * (1 - e);
      if (a.t >= 1) a.phase = "idle";
    }
  });

  const product = products.find((p) => p.id === shown) ?? products[0];
  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.35}>
        <CoffeeBag product={product} />
      </Float>
    </group>
  );
}

/** Warm key light that follows the pointer across the canvas. */
function PointerLight() {
  const light = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!light.current) return;
    light.current.position.x = THREE.MathUtils.lerp(light.current.position.x, state.pointer.x * 4, 0.08);
    light.current.position.y = THREE.MathUtils.lerp(light.current.position.y, state.pointer.y * 3 + 1, 0.08);
  });
  return <pointLight ref={light} position={[0, 1, 3]} intensity={18} color="#ffd9a8" distance={12} />;
}

/** Smoothly dolly the camera to the requested distance (zoom buttons). */
function Zoom({ distance }: { distance: number }) {
  useFrame(({ camera }) => {
    const len = camera.position.length();
    if (Math.abs(len - distance) > 0.001) camera.position.setLength(THREE.MathUtils.lerp(len, distance, 0.1));
  });
  return null;
}

export default function ProductViewer({ productId, mobile, distance = 5.6 }: { productId: string; mobile: boolean; distance?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="h-full w-full touch-pan-y">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={mobile ? [1, 1.25] : [1, 1.5]}
        camera={{ position: [0, 0.3, 5.6], fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.25} />
          <spotLight position={[-4, 6, 4]} angle={0.5} penumbra={1} intensity={90} color="#fff1dc" />
          <pointLight position={[3, 1, -3]} intensity={25} color="#c49a62" />
          <PointerLight />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={4} position={[-3, 3, 3]} scale={[4, 3, 1]} color="#fff0d8" />
            <Lightformer form="rect" intensity={2.5} position={[4, 0, 1]} scale={[1, 5, 1]} color="#c49a62" />
            <Lightformer form="rect" intensity={1} position={[0, -3, 2]} scale={[6, 1, 1]} color="#6f4228" />
          </Environment>
          <Zoom distance={distance} />
          <SwappingBag productId={productId} />
          <ContactShadows frames={1} resolution={256} position={[0, -1.45, 0]} opacity={0.7} scale={6} blur={2.4} far={2.5} />
          <OrbitControls
            enablePan={false}
            // wheel-zoom would hijack page scrolling, so zoom is driven by the on-screen buttons
            enableZoom={false}
            autoRotate
            autoRotateSpeed={1.1}
            enableDamping
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
