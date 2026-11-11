"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const vertex = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vUv = uv;
    vec3 p = position;
    // sway more the higher it rises
    p.x += sin(uv.y * 4.0 + uTime * 0.9) * 0.12 * uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform float uOpacity;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.22 + uSeed;
    float wisp = fbm(vec2(uv.x * 2.6 + sin(uv.y * 3.0 + t) * 0.5, uv.y * 2.2 - t * 1.4));
    float column = 1.0 - smoothstep(0.0, 0.32 + uv.y * 0.12, abs(uv.x - 0.5 + sin(uv.y * 5.0 + t * 2.0) * 0.08));
    float fade = smoothstep(0.0, 0.18, uv.y) * smoothstep(1.0, 0.45, uv.y);
    float a = smoothstep(0.42, 0.85, wisp) * column * fade * uOpacity;
    gl_FragColor = vec4(vec3(0.96, 0.9, 0.82), a);
  }
`;

function Wisp({ x, z, seed, height, opacity }: { x: number; z: number; seed: number; height: number; opacity: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSeed: { value: seed }, uOpacity: { value: opacity } }), [seed, opacity]);
  useFrame((s) => {
    if (mat.current) mat.current.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh position={[x, height / 2, z]}>
      <planeGeometry args={[0.95, height, 1, 32]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Soft rising steam from shader-driven noise planes. */
export default function Steam() {
  return (
    <group>
      <Wisp x={-0.12} z={0} seed={0} height={2.6} opacity={0.55} />
      <Wisp x={0.16} z={0.12} seed={4.2} height={2.2} opacity={0.4} />
      <Wisp x={0.02} z={-0.15} seed={9.7} height={3} opacity={0.32} />
    </group>
  );
}
