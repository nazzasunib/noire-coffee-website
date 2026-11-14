"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type Drop = { p: THREE.Vector3; v: THREE.Vector3; life: number; size: number; floor: number };

export type BurstOptions = {
  count?: number;
  /** spawn on a ring of this radius (crown splash); 0 = point */
  ring?: number;
  up?: [number, number];
  out?: [number, number];
  size?: [number, number];
  /** droplets vanish when they fall below this world Y */
  floor?: number;
};

export type DropletsHandle = { burst: (origin: THREE.Vector3, opts?: BurstOptions) => void };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** World-space pool of coffee droplets: stretched along velocity, arcing under gravity. */
const Droplets = forwardRef<DropletsHandle, { pool?: number; timeScale?: number }>(function Droplets({ pool = 180, timeScale = 1 }, ref) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo<Drop[]>(
    () => Array.from({ length: pool }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, size: 0, floor: -99 })),
    [pool],
  );
  const cursor = useRef(0);

  useImperativeHandle(ref, () => ({
    burst(origin, o = {}) {
      const { count = 20, ring = 0, up = [1.6, 2.8], out = [0.4, 1.2], size = [0.014, 0.034], floor = origin.y - 0.15 } = o;
      for (let k = 0; k < count; k++) {
        const d = drops[cursor.current];
        cursor.current = (cursor.current + 1) % drops.length;
        const a = Math.random() * Math.PI * 2;
        const r = ring * rand(0.75, 1);
        d.p.set(origin.x + Math.cos(a) * r, origin.y, origin.z + Math.sin(a) * r);
        const o2 = rand(out[0], out[1]);
        d.v.set(Math.cos(a) * o2, rand(up[0], up[1]), Math.sin(a) * o2);
        d.life = 1;
        d.size = rand(size[0], size[1]);
        d.floor = floor;
      }
    },
  }));

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const step = Math.min(dt, 1 / 30) * timeScale;
    drops.forEach((d, i) => {
      if (d.life > 0) {
        d.v.y -= 7.5 * step;
        d.p.addScaledVector(d.v, step);
        d.life -= step * 0.8;
        if (d.p.y < d.floor && d.v.y < 0) d.life = 0;
      }
      const s = d.life > 0 ? d.size * Math.min(1, d.life * 3) : 0;
      dummy.position.copy(d.p);
      dummy.scale.set(s, s * (1 + Math.min(0.6, d.v.length() * 0.08)), s);
      dummy.lookAt(d.p.x + d.v.x, d.p.y + d.v.y, d.p.z + d.v.z);
      dummy.rotateX(Math.PI / 2);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, pool]} frustumCulled={false}>
      <sphereGeometry args={[1, 16, 12]} />
      {/* real liquid: light passes through (amber core), dark body, sharp wet reflection */}
      <meshPhysicalMaterial
        color="#6a2f10"
        emissive="#7a3a12"
        emissiveIntensity={0.35}
        roughness={0.04}
        clearcoat={1}
        clearcoatRoughness={0.02}
        transparent
        opacity={0.88}
      />
    </instancedMesh>
  );
});

export default Droplets;
