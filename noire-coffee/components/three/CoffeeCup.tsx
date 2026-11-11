"use client";

import { useEffect, useMemo, useRef } from "react";
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

/** Matte black ceramic cup + saucer with gold rim, crema surface and monogram. */
export default function CoffeeCup() {
  const cup = useMemo(() => createCupGeometry(), []);
  const handle = useMemo(() => createHandleGeometry(), []);
  const saucer = useMemo(() => createSaucerGeometry(), []);
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
      [cup, handle, saucer].forEach((g) => g.dispose());
      crema.dispose();
      mono.dispose();
    },
    [cup, handle, saucer, crema, mono],
  );

  useFrame((s) => {
    if (liquidRef.current) liquidRef.current.rotation.z = s.clock.elapsedTime * 0.05;
  });

  const ceramic = (
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
  const gold = <meshStandardMaterial color="#d4ab72" metalness={1} roughness={0.22} />;
  const rimR = cupRadiusAt(CUP.height) - CUP.wall / 2;
  const liquidR = cupRadiusAt(CUP.liquidY) - CUP.wall - 0.004;
  const bandY = 0.62;

  return (
    <group>
      <mesh geometry={cup} castShadow receiveShadow>
        {ceramic}
      </mesh>
      <mesh geometry={handle}>{ceramic}</mesh>
      {/* gold rim */}
      <mesh position={[0, CUP.height + 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[rimR, 0.017, 16, 128]} />
        {gold}
      </mesh>
      {/* thin gold band */}
      <mesh position={[0, bandY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[cupRadiusAt(bandY) + 0.002, 0.006, 8, 128]} />
        {gold}
      </mesh>
      {/* monogram decal-like curved panel */}
      <mesh position={[0, 0.88, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[cupRadiusAt(1.02) + 0.003, cupRadiusAt(0.74) + 0.003, 0.36, 48, 1, true, -0.42, 0.84]} />
        <meshStandardMaterial map={mono} transparent metalness={1} roughness={0.25} color="#ffffff" depthWrite={false} />
      </mesh>
      {/* crema */}
      <mesh ref={liquidRef} position={[0, CUP.liquidY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[liquidR, 64]} />
        <meshPhysicalMaterial map={crema} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.25} />
      </mesh>
      {/* saucer */}
      <mesh geometry={saucer} position={[0, -0.1, 0]} receiveShadow castShadow>
        {ceramic}
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.69, 0.012, 8, 160]} />
        {gold}
      </mesh>
    </group>
  );
}
