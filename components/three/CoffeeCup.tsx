"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  CUP,
  cupRadiusAt,
  createCremaTexture,
  createCupGeometry,
  createHandleGeometry,
  createMonogramTexture,
  createSaucerGeometry,
} from "@/lib/geometry";

const LIQUID_MIN_Y = 0.2;

function Ceramic() {
  return (
    <meshPhysicalMaterial
      color="#17100c"
      roughness={0.38}
      metalness={0.05}
      clearcoat={1}
      clearcoatRoughness={0.18}
      sheen={0.4}
      sheenColor="#6f4228"
    />
  );
}
function Gold() {
  return <meshStandardMaterial color="#d4ab72" metalness={1} roughness={0.22} />;
}

/** Saucer with gold rim — separate so a cup can be lifted off it. */
export function Saucer() {
  const saucer = useMemo(() => createSaucerGeometry(), []);
  useEffect(() => () => saucer.dispose(), [saucer]);
  return (
    <group>
      <mesh geometry={saucer} position={[0, -0.1, 0]} receiveShadow castShadow>
        <Ceramic />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.69, 0.012, 8, 160]} />
        <Gold />
      </mesh>
    </group>
  );
}

/** Height of the coffee surface (cup-local) for a fill level 0–1. */
export const liquidHeight = (fill: number) => LIQUID_MIN_Y + (CUP.liquidY - LIQUID_MIN_Y) * fill;

/**
 * Matte black ceramic cup with gold rim, crema surface and monogram.
 * `fillRef` (0–1) drives the coffee level every frame without re-rendering.
 */
export default function CoffeeCup({ fillRef, withSaucer = true }: { fillRef?: MutableRefObject<number>; withSaucer?: boolean }) {
  const cup = useMemo(() => createCupGeometry(), []);
  const handle = useMemo(() => createHandleGeometry(), []);
  const crema = useMemo(() => createCremaTexture(), []);
  const mono = useMemo(() => createMonogramTexture(), []);
  const liquidRef = useRef<THREE.Mesh>(null);

  // redraw monogram once the serif font is ready
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      const fresh = createMonogramTexture();
      (mono.image as HTMLCanvasElement).getContext("2d")!.drawImage(fresh.image as HTMLCanvasElement, 0, 0);
      mono.needsUpdate = true;
      fresh.dispose();
    });
    return () => {
      alive = false;
    };
  }, [mono]);

  useEffect(
    () => () => {
      [cup, handle].forEach((g) => g.dispose());
      crema.dispose();
      mono.dispose();
    },
    [cup, handle, crema, mono],
  );

  useFrame((s) => {
    const m = liquidRef.current;
    if (!m) return;
    const fill = fillRef ? fillRef.current : 1;
    m.visible = fill > 0.02;
    const y = liquidHeight(fill);
    const r = cupRadiusAt(y) - CUP.wall - 0.004;
    m.position.y = y;
    m.scale.set(r, r, 1);
    m.rotation.z = s.clock.elapsedTime * 0.05;
  });

  const rimR = cupRadiusAt(CUP.height) - CUP.wall / 2;
  const bandY = 0.62;

  return (
    <group>
      <mesh geometry={cup} castShadow receiveShadow>
        <Ceramic />
      </mesh>
      <mesh geometry={handle}>
        <Ceramic />
      </mesh>
      <mesh position={[0, CUP.height + 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[rimR, 0.017, 16, 128]} />
        <Gold />
      </mesh>
      <mesh position={[0, bandY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[cupRadiusAt(bandY) + 0.002, 0.006, 8, 128]} />
        <Gold />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[cupRadiusAt(1.02) + 0.003, cupRadiusAt(0.74) + 0.003, 0.36, 48, 1, true, -0.42, 0.84]} />
        <meshStandardMaterial map={mono} transparent metalness={1} roughness={0.25} color="#ffffff" depthWrite={false} />
      </mesh>
      {/* coffee surface (unit circle, scaled to the cup wall at its height) */}
      <mesh ref={liquidRef} position={[0, CUP.liquidY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshPhysicalMaterial map={crema} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.25} />
      </mesh>
      {withSaucer && <Saucer />}
    </group>
  );
}
