"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BAG, createBagGeometry, drawBagFace } from "@/lib/geometry";
import type { Product } from "@/lib/products";

function makeFaceTextures(product: Product, side: "front" | "back") {
  const W = 640;
  const H = 1000;
  const make = (mode: "color" | "pbr") => {
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    drawBagFace(cv.getContext("2d")!, W, H, product.palette, product, mode, side);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8;
    if (mode === "color") tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  return { map: make("color"), pbr: make("pbr") };
}

/** Procedural stand-up coffee pouch with foil-stamped label textures. */
export default function CoffeeBag({ product }: { product: Product }) {
  const geo = useMemo(() => createBagGeometry(), []);

  const materials = useMemo(() => {
    const front = makeFaceTextures(product, "front");
    const back = makeFaceTextures(product, "back");
    const plain = new THREE.MeshStandardMaterial({ color: product.palette.bag, roughness: 0.62, metalness: product.palette.bag === "#c49a62" ? 0.55 : 0.05 });
    const face = (t: ReturnType<typeof makeFaceTextures>) =>
      new THREE.MeshStandardMaterial({ map: t.map, roughnessMap: t.pbr, metalnessMap: t.pbr, roughness: 1, metalness: 1 });
    // Box groups: +x, -x, +y, -y, +z (front), -z (back)
    return [plain, plain, plain, plain, face(front), face(back)];
  }, [product]);

  // repaint once web fonts are ready so the label uses the brand serif
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      (["front", "back"] as const).forEach((side, k) => {
        const m = materials[4 + k];
        const map = m.map!;
        const pbr = m.roughnessMap!;
        drawBagFace((map.image as HTMLCanvasElement).getContext("2d")!, 640, 1000, product.palette, product, "color", side);
        drawBagFace((pbr.image as HTMLCanvasElement).getContext("2d")!, 640, 1000, product.palette, product, "pbr", side);
        map.needsUpdate = true;
        pbr.needsUpdate = true;
      });
    });
    return () => {
      alive = false;
    };
  }, [materials, product]);

  useEffect(
    () => () => {
      materials.forEach((m) => {
        m.map?.dispose();
        m.roughnessMap?.dispose();
        m.dispose();
      });
    },
    [materials],
  );
  useEffect(() => () => geo.dispose(), [geo]);

  const top = BAG.h / 2;
  return (
    <group>
      <mesh geometry={geo} material={materials} castShadow />
      {/* degassing valve */}
      <mesh position={[0.42, top - 0.62, BAG.d / 2 + 0.035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 32]} />
        <meshStandardMaterial color={product.palette.bag} roughness={0.3} />
      </mesh>
      {/* gold tin-tie at the seal */}
      <mesh position={[0, top - 0.16, 0.035]}>
        <boxGeometry args={[BAG.w * 1.04, 0.05, 0.04]} />
        <meshStandardMaterial color="#d4ab72" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}
