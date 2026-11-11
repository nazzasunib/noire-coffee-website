"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createBeanGeometry } from "@/lib/geometry";
import { sceneState } from "@/lib/sceneState";

type Bean = {
  base: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  scale: number;
  phase: number;
  depth: number;
};

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Instanced, depth-layered coffee beans orbiting the hero cup with pointer parallax. */
export default function FloatingBeans({ count = 34, spread = 1, offsetX = 0 }: { count?: number; spread?: number; offsetX?: number }) {
  const geo = useMemo(() => createBeanGeometry(), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const beans = useMemo<Bean[]>(() => {
    const rnd = seeded(42);
    return Array.from({ length: count }, () => {
      // place on a loose shell around the cup, leaving the centre free
      const a = rnd() * Math.PI * 2;
      const r = 2.1 + rnd() * 2.6;
      const y = -1.2 + rnd() * 4.4;
      const z = -2.5 + rnd() * 4.2;
      return {
        base: new THREE.Vector3(Math.cos(a) * r * spread, y, z + Math.sin(a) * 0.6),
        rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
        spin: new THREE.Vector3((rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.4),
        scale: 0.13 + rnd() * 0.12 + (z > 1 ? 0.06 : 0),
        phase: rnd() * Math.PI * 2,
        depth: 0.3 + (z + 2.5) / 4.2,
      };
    });
  }, [count, spread]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new THREE.Color();
    const rnd = seeded(7);
    beans.forEach((_, i) => {
      c.setHSL(0.06 + rnd() * 0.02, 0.55 + rnd() * 0.15, 0.06 + rnd() * 0.05);
      mesh.setColorAt(i, c);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [beans]);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const { pointer, heroProgress } = sceneState;
    beans.forEach((b, i) => {
      dummy.position.set(
        offsetX + b.base.x + pointer.x * 0.35 * b.depth,
        b.base.y + Math.sin(t * 0.6 + b.phase) * 0.18 + pointer.y * 0.2 * b.depth + heroProgress * b.depth * 2.2,
        b.base.z,
      );
      dummy.rotation.set(b.rot.x + t * b.spin.x, b.rot.y + t * b.spin.y, b.rot.z + t * b.spin.z);
      dummy.scale.setScalar(b.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} castShadow frustumCulled={false}>
      <meshPhysicalMaterial vertexColors roughness={0.5} clearcoat={0.45} clearcoatRoughness={0.3} />
    </instancedMesh>
  );
}
