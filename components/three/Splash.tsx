"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CUP, cupRadiusAt } from "@/lib/geometry";
import { sceneState } from "@/lib/sceneState";

type Drop = { p: THREE.Vector3; v: THREE.Vector3; life: number; size: number };

/**
 * Crown splash: coffee droplets burst from the crema ring, arc under gravity and fade.
 * Fires on a slow loop and whenever the hero cup is clicked.
 */
export default function Splash({ count = 70, interval = 7 }: { count?: number; interval?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo<Drop[]>(
    () => Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, size: 0 })),
    [count],
  );
  const last = useRef({ auto: 1.5, manual: 0 });

  const burst = () => {
    const r = cupRadiusAt(CUP.liquidY) - 0.12;
    drops.forEach((d, i) => {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      const crown = i % 3 !== 0; // most drops form the crown, some fly higher
      d.p.set(Math.cos(a) * r * (0.6 + Math.random() * 0.4), CUP.liquidY + 0.02, Math.sin(a) * r * (0.6 + Math.random() * 0.4));
      const out = crown ? 0.9 + Math.random() * 0.8 : 0.3 + Math.random() * 0.5;
      const up = crown ? 2.2 + Math.random() * 1.2 : 3.4 + Math.random() * 1.6;
      d.v.set(Math.cos(a) * out, up, Math.sin(a) * out);
      d.life = 1;
      d.size = crown ? 0.018 + Math.random() * 0.022 : 0.01 + Math.random() * 0.016;
    });
  };

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 1 / 30);
    if (t - last.current.auto > interval) {
      last.current.auto = t;
      burst();
    }
    if (sceneState.splash !== last.current.manual) {
      last.current.manual = sceneState.splash;
      burst();
    }
    drops.forEach((d, i) => {
      if (d.life > 0) {
        d.v.y -= 7.5 * step;
        d.p.addScaledVector(d.v, step);
        d.life -= step * 0.75;
        if (d.p.y < 0.15) d.life = 0;
      }
      const s = d.life > 0 ? d.size * Math.min(1, d.life * 3) : 0;
      dummy.position.copy(d.p);
      // stretch drops along their velocity for motion feel
      dummy.scale.set(s, s * (1 + Math.min(2, d.v.length() * 0.18)), s);
      dummy.lookAt(d.p.x + d.v.x, d.p.y + d.v.y, d.p.z + d.v.z);
      dummy.rotateX(Math.PI / 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 10]} />
      <meshPhysicalMaterial color="#7a3e16" roughness={0.05} clearcoat={1} emissive="#5a2a0a" emissiveIntensity={0.35} />
    </instancedMesh>
  );
}
