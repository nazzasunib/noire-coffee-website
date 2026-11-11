"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createCremaTexture } from "@/lib/geometry";
import { Saucer } from "./CoffeeCup";

/** Handle-less, diamond-faceted espresso cup (like the Story section photo). */
export const FACET = { height: 1.15, wall: 0.06, rows: 6, sides: 10 };
const outerR = (y: number) => 0.6 + 0.36 * Math.pow(Math.min(1, Math.max(0, y / FACET.height)), 0.85);
export const facetInnerR = (y: number) => outerR(y) - FACET.wall;
export const MILK_START = 0.68;
export const facetLiquidHeight = (fill: number) => 0.22 + (FACET.height - 0.12 - 0.22) * fill;

/** Diamond facets: alternate rings are rotated half a step, then flat-shaded. */
function createFacetedShell() {
  const { rows, sides, height } = FACET;
  const pos: number[] = [];
  const ring = (r: number) => {
    const y = (r / rows) * height;
    const rad = outerR(y);
    const off = (r % 2) * (Math.PI / sides);
    return Array.from({ length: sides }, (_, i) => {
      const a = (i / sides) * Math.PI * 2 + off;
      return new THREE.Vector3(Math.sin(a) * rad, y, Math.cos(a) * rad);
    });
  };
  const rings = Array.from({ length: rows + 1 }, (_, r) => ring(r));
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const n = new THREE.Vector3();
  // push a triangle, flipping it if its normal points into the cup
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, outward = true) => {
    e1.subVectors(b, a);
    e2.subVectors(c, a);
    n.crossVectors(e1, e2);
    const cx = (a.x + b.x + c.x) / 3;
    const cz = (a.z + b.z + c.z) / 3;
    const out = outward ? n.x * cx + n.z * cz : -n.y;
    const v = out >= 0 ? [a, b, c] : [a, c, b];
    v.forEach((p) => pos.push(p.x, p.y, p.z));
  };
  for (let r = 0; r < rows; r++) {
    const a = rings[r];
    const b = rings[r + 1];
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      if (r % 2 === 0) {
        tri(a[i], a[j], b[i]);
        tri(a[j], b[j], b[i]);
      } else {
        tri(a[i], a[j], b[j]);
        tri(a[i], b[j], b[i]);
      }
    }
  }
  // flat bottom
  const c = new THREE.Vector3(0, 0, 0);
  for (let i = 0; i < sides; i++) tri(rings[0][(i + 1) % sides], rings[0][i], c, false);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function createInnerWall() {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i++) {
    const y = 0.14 + (i / 20) * (FACET.height - 0.14);
    pts.push(new THREE.Vector2(facetInnerR(y), y));
  }
  return new THREE.LatheGeometry(pts, 64);
}

function createMilkTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.8, "#f4ede3");
  g.addColorStop(1, "#d9cbb8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(220,205,185,${Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const MILK = new THREE.Color("#ffffff");
const LATTE = new THREE.Color("#c99a6b");

/**
 * `fillRef`: 0 = milk only (starting level), 1 = brim.
 * `mixRef`: 0 = pure white milk → 1 = fully coffee-coloured crema.
 */
export default function FacetedCup({ fillRef, mixRef }: { fillRef: MutableRefObject<number>; mixRef: MutableRefObject<number> }) {
  const shell = useMemo(() => createFacetedShell(), []);
  const inner = useMemo(() => createInnerWall(), []);
  const milkTex = useMemo(() => createMilkTexture(), []);
  const crema = useMemo(() => createCremaTexture(), []);
  const milk = useRef<THREE.Mesh>(null);
  const coffee = useRef<THREE.Mesh>(null);
  const tint = useMemo(() => new THREE.Color(), []);

  useEffect(
    () => () => {
      shell.dispose();
      inner.dispose();
      milkTex.dispose();
      crema.dispose();
    },
    [shell, inner, milkTex, crema],
  );

  useFrame((s) => {
    const fill = MILK_START + (1 - MILK_START) * fillRef.current;
    const mix = mixRef.current;
    const y = facetLiquidHeight(fill);
    const r = facetInnerR(y) - 0.004;
    const t = s.clock.elapsedTime;
    if (milk.current) {
      milk.current.position.y = y;
      milk.current.scale.set(r, r, 1);
      // milk warms to latte as coffee mixes in
      tint.copy(MILK).lerp(LATTE, Math.min(1, mix * 1.4));
      const m = milk.current.material as THREE.MeshPhysicalMaterial;
      m.color.copy(tint);
      milk.current.rotation.z = t * (0.05 + mix * 0.6);
    }
    if (coffee.current) {
      coffee.current.position.y = y + 0.003;
      coffee.current.scale.set(r, r, 1);
      const m = coffee.current.material as THREE.MeshPhysicalMaterial;
      m.opacity = Math.max(0, (mix - 0.25) / 0.75);
      coffee.current.visible = m.opacity > 0.01;
      // swirl while the pour mixes, then settle
      coffee.current.rotation.z = -t * (0.08 + (1 - mix) * 0.8);
    }
  });

  return (
    <group>
      <mesh geometry={shell} castShadow>
        <meshPhysicalMaterial color="#2a201b" roughness={0.28} metalness={0.35} clearcoat={0.7} clearcoatRoughness={0.25} flatShading sheen={0.3} sheenColor="#6f4228" />
      </mesh>
      <mesh geometry={inner}>
        <meshStandardMaterial color="#0d0907" roughness={0.6} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, FACET.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[outerR(FACET.height) - FACET.wall / 2, FACET.wall / 2, 10, 64]} />
        <meshPhysicalMaterial color="#1a1412" roughness={0.35} clearcoat={0.8} />
      </mesh>
      <mesh ref={milk} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshPhysicalMaterial map={milkTex} roughness={0.25} clearcoat={0.6} />
      </mesh>
      <mesh ref={coffee} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshPhysicalMaterial map={crema} roughness={0.3} clearcoat={0.8} transparent opacity={0} depthWrite={false} />
      </mesh>
      <Saucer />
    </group>
  );
}
