"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/** Shared, mutable pour state written by the hero rig each frame (world space). */
export type PourState = { lip: THREE.Vector3; target: THREE.Vector3; amount: number; scale: number };

function makeFlowTexture() {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 32;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 32);
  g.addColorStop(0, "#2a1208");
  g.addColorStop(0.45, "#7a3e18");
  g.addColorStop(0.55, "#a8642c");
  g.addColorStop(1, "#2a1208");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 32);
  // flowing highlights
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(230,170,110,${Math.random() * 0.25})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 32, 20 + Math.random() * 60, 1 + Math.random() * 2);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}

/** A glossy coffee stream from the tilted cup's lip, curving down into the second cup. */
export default function PourStream({ state }: { state: PourState }) {
  const mesh = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => makeFlowTexture(), []);
  const pts = useMemo(() => [0, 1, 2, 3, 4].map(() => new THREE.Vector3()), []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts), [pts]);

  useEffect(() => () => {
    tex.dispose();
    mesh.current?.geometry.dispose();
  }, [tex]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const { lip, target, amount, scale } = state;
    m.visible = amount > 0.01;
    if (!m.visible) return;
    tex.offset.x -= dt * 2.4;

    // lip → short outward arc → free fall into the target
    const dx = target.x - lip.x;
    pts[0].copy(lip);
    pts[1].set(lip.x + 0.12 * scale + dx * 0.15, lip.y - 0.08 * scale, lip.z);
    pts[2].set(lip.x + dx * 0.55, lip.y + (target.y - lip.y) * 0.35, lip.z + (target.z - lip.z) * 0.5);
    pts[3].set(target.x - dx * 0.05, target.y + (lip.y - target.y) * 0.12, target.z);
    pts[4].copy(target);
    curve.updateArcLengths();

    const radius = 0.05 * scale * Math.min(1, amount * 1.4);
    const geo = new THREE.TubeGeometry(curve, 40, radius, 10, false);
    m.geometry.dispose();
    m.geometry = geo;
  });

  return (
    <mesh ref={mesh} visible={false} frustumCulled={false}>
      <bufferGeometry />
      <meshPhysicalMaterial map={tex} roughness={0.12} clearcoat={1} clearcoatRoughness={0.1} emissive="#3a1806" emissiveIntensity={0.25} />
    </mesh>
  );
}
