"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { createBeanGeometry } from "@/lib/geometry";

/** Grainy dark-slate backdrop texture, painted once (no photo, so it is crisp at any resolution). */
function useBackdrop() {
  return useMemo(() => {
    const S = 1024;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const c = cv.getContext("2d")!;
    const g = c.createRadialGradient(S * 0.35, S * 0.4, 0, S * 0.5, S * 0.5, S * 0.75);
    g.addColorStop(0, "#2a211b");
    g.addColorStop(0.6, "#17120f");
    g.addColorStop(1, "#0b0807");
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    // mottled stone
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * S, y = Math.random() * S, r = 4 + Math.random() * 40;
      const gg = c.createRadialGradient(x, y, 0, x, y, r);
      const warm = Math.random() > 0.6;
      gg.addColorStop(0, warm ? "rgba(110,60,30,0.08)" : "rgba(0,0,0,0.12)");
      gg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = gg;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const img = c.getImageData(0, 0, S, S);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    c.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

/** Speckled white stoneware cup, like the original photo. */
function useSpeckle() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 256;
    const c = cv.getContext("2d")!;
    c.fillStyle = "#e9e4dc";
    c.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = `rgba(${60 + Math.random() * 40},${40 + Math.random() * 30},30,${0.25 + Math.random() * 0.5})`;
      c.beginPath();
      c.arc(Math.random() * 512, Math.random() * 256, 0.4 + Math.random() * 1.4, 0, Math.PI * 2);
      c.fill();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }, []);
}

function Backdrop() {
  const tex = useBackdrop();
  const { viewport } = useThree();
  return (
    <mesh position={[0, 0, -4]} scale={[viewport.width * 2.2, viewport.height * 2.2, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function Cup() {
  const tex = useSpeckle();
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(new THREE.Vector2(0.55 + 0.42 * Math.pow(Math.sin((t * Math.PI) / 2), 0.9), t * 1.15));
    }
    for (let i = 24; i >= 0; i--) {
      const t = i / 24;
      pts.push(new THREE.Vector2(0.5 + 0.42 * Math.pow(Math.sin((t * Math.PI) / 2), 0.9), 0.1 + t * 1.05));
    }
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.position.y = -0.55 + Math.sin(t * 0.7) * 0.06;
    g.current.rotation.z = 0.22 + Math.sin(t * 0.5) * 0.03;
  });
  return (
    <group ref={g} position={[2.05, -0.55, 0.2]} rotation={[0.35, 0.4, 0.22]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial map={tex} roughness={0.55} clearcoat={0.4} clearcoatRoughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* brown glaze rim */}
      <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.945, 0.026, 12, 96]} />
        <meshStandardMaterial color="#5a3420" roughness={0.5} />
      </mesh>
      {/* coffee surface */}
      <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.88, 64]} />
        <meshPhysicalMaterial color="#1c0d06" roughness={0.12} clearcoat={1} />
      </mesh>
    </group>
  );
}

type Bean = { x: number; y: number; z: number; vy: number; rot: THREE.Euler; spin: THREE.Vector3; s: number };

/** Roasted beans tumbling down in slow motion and wrapping back to the top. */
function Beans({ count = 16 }: { count?: number }) {
  const geo = useMemo(() => createBeanGeometry(64, 40), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const beans = useMemo<Bean[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: -0.6 + Math.random() * 2.8,
        y: -3 + Math.random() * 6,
        z: -1.2 + Math.random() * 2,
        vy: 0.18 + Math.random() * 0.22,
        rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        spin: new THREE.Vector3((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.6),
        s: 0.17 + Math.random() * 0.09,
      })),
    [count],
  );
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    beans.forEach((_, i) => {
      c.setHSL(0.065 + Math.random() * 0.015, 0.55, 0.11 + Math.random() * 0.05);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [beans]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const step = Math.min(dt, 0.05);
    beans.forEach((b, i) => {
      b.y -= b.vy * step;
      if (b.y < -3.2) { b.y = 3.2; b.x = -0.6 + Math.random() * 2.8; }
      b.rot.x += b.spin.x * step; b.rot.y += b.spin.y * step; b.rot.z += b.spin.z * step;
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.copy(b.rot);
      dummy.scale.setScalar(b.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
      {/* oily roast sheen: low roughness + clearcoat catches the key light like the photo */}
      <meshPhysicalMaterial vertexColors roughness={0.38} clearcoat={0.9} clearcoatRoughness={0.25} sheen={0.4} sheenColor="#8a5a34" />
    </instancedMesh>
  );
}

/** "Source" step: beans falling past a speckled white cup — rendered live, sharp at any screen resolution. */
export default function BeanFallScene({ active = true }: { active?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "150px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="absolute inset-0 bg-[#100c0a]">
      <Canvas
        frameloop={visible && active ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 7], fov: 36 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.15} />
          <spotLight position={[-4, 5, 5]} angle={0.5} penumbra={1} intensity={110} color="#ffe6cc" />
          <pointLight position={[4, -1, 3]} intensity={10} color="#c49a62" />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={3.5} position={[-3, 3, 4]} scale={[3, 2, 1]} color="#fff1e0" />
            <Lightformer form="rect" intensity={1.2} position={[4, 0, 2]} scale={[1, 4, 1]} color="#c49a62" />
          </Environment>
          <Backdrop />
          <Beans />
          <Cup />
        </Suspense>
      </Canvas>
    </div>
  );
}
