"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CUP, cupRadiusAt, createBeanGeometry } from "@/lib/geometry";

type Bean = { pos: THREE.Vector3; vy: number; rot: THREE.Euler; spin: THREE.Vector3; wait: number; state: "wait" | "fall" | "sink"; sink: number };
type Ripple = { pos: THREE.Vector3; t: number };

const SPAWN_Y = 4.2;
const GRAVITY = 6.5;

/**
 * Beans drop one after another into the cup (cup-local space). On hitting the crema they
 * trigger `onImpact` (world-space splash) and an expanding ripple ring, then sink out of view.
 */
export default function DroppingBeans({
  count = 4,
  activeRef,
  onImpact,
}: {
  count?: number;
  activeRef: { current: boolean };
  onImpact: (worldPos: THREE.Vector3) => void;
}) {
  const geo = useMemo(() => createBeanGeometry(36, 24), []);
  const group = useRef<THREE.Group>(null);
  const beanRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const beans = useMemo<Bean[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        pos: new THREE.Vector3(),
        vy: 0,
        rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        spin: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4),
        wait: 0.9 + i * 0.42,
        state: "wait",
        sink: 0,
      })),
    [count],
  );
  const ripples = useMemo<Ripple[]>(() => Array.from({ length: 4 }, () => ({ pos: new THREE.Vector3(), t: 1 })), []);
  const nextRipple = useRef(0);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, dt) => {
    const step = Math.min(dt, 1 / 30);
    const maxR = cupRadiusAt(CUP.liquidY) - CUP.wall - 0.22;

    beans.forEach((b, i) => {
      const m = beanRefs.current[i];
      if (!m) return;
      if (b.state === "wait") {
        m.visible = false;
        b.wait -= step;
        if (b.wait <= 0 && activeRef.current) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * maxR;
          b.pos.set(Math.cos(a) * r, SPAWN_Y, Math.sin(a) * r);
          b.vy = -0.6;
          b.state = "fall";
        }
        return;
      }
      m.visible = true;
      if (b.state === "fall") {
        b.vy -= GRAVITY * step;
        b.pos.y += b.vy * step;
        b.rot.x += b.spin.x * step;
        b.rot.y += b.spin.y * step;
        b.rot.z += b.spin.z * step;
        if (b.pos.y <= CUP.liquidY + 0.02) {
          b.state = "sink";
          b.sink = 0;
          // splash in world space
          tmp.set(b.pos.x, CUP.liquidY + 0.02, b.pos.z);
          group.current?.localToWorld(tmp);
          onImpact(tmp.clone());
          const rp = ripples[nextRipple.current];
          nextRipple.current = (nextRipple.current + 1) % ripples.length;
          rp.pos.set(b.pos.x, CUP.liquidY + 0.004, b.pos.z);
          rp.t = 0;
        }
      } else {
        b.sink += step;
        b.pos.y -= step * 0.6;
        if (b.sink > 0.4) {
          b.state = "wait";
          b.wait = 0.5 + Math.random() * 1.1;
        }
      }
      m.position.copy(b.pos);
      m.rotation.copy(b.rot);
      m.scale.setScalar(0.15 * (b.state === "sink" ? Math.max(0, 1 - b.sink * 2.5) : 1));
    });

    ripples.forEach((r, i) => {
      const m = ringRefs.current[i];
      if (!m) return;
      r.t = Math.min(1, r.t + step * 1.1);
      m.visible = r.t < 1;
      m.position.copy(r.pos);
      const s = 0.04 + r.t * 0.45;
      m.scale.set(s, s, 1);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - r.t) * 0.55;
    });
  });

  return (
    <group ref={group}>
      {beans.map((_, i) => (
        <mesh key={i} ref={(el) => (beanRefs.current[i] = el)} geometry={geo} visible={false}>
          <meshPhysicalMaterial vertexColors color="#3b2214" roughness={0.45} clearcoat={0.5} />
        </mesh>
      ))}
      {ripples.map((_, i) => (
        <mesh key={i} ref={(el) => (ringRefs.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.82, 1, 48]} />
          <meshBasicMaterial color="#e9c99c" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
