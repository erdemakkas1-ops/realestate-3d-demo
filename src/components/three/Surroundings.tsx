"use client";

import { memo, useEffect, useMemo } from "react";
import { BackSide, BoxGeometry, CylinderGeometry, IcosahedronGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PLAZA_DEPTH, PLAZA_WIDTH, PODIUM_DEPTH, PODIUM_WIDTH } from "@/lib/buildingConfig";

// Dusk gradient: deep navy overhead, a warm band low on the horizon behind the skyline.
const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    float h = vDirection.y;
    vec3 zenith = vec3(0.035, 0.06, 0.11);
    vec3 dusk = vec3(0.13, 0.17, 0.25);
    vec3 glow = vec3(0.86, 0.5, 0.25);
    float horizon = exp(-abs(h) * 9.0);
    // The sun has set behind the city, slightly to the left of the default view.
    float sunSide = pow(max(dot(normalize(vec3(vDirection.x, 0.0, vDirection.z)), normalize(vec3(-0.35, 0.0, -1.0))), 0.0), 3.0);
    vec3 color = mix(dusk, zenith, smoothstep(0.0, 0.55, abs(h)));
    color += glow * horizon * (0.25 + 0.75 * sunSide);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

function hash(n: number) {
  const x = Math.sin(n * 91.3458) * 47453.5453;
  return x - Math.floor(x);
}

function createSkyline(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 70; i++) {
    // An arc of blocks behind the project, as seen from the default front-right camera.
    const angle = Math.PI * (0.8 + 1.4 * (i / 70)) + (hash(i) - 0.5) * 0.08;
    const radius = 95 + hash(i + 10) * 60;
    const height = 4 + Math.pow(hash(i + 20), 2.4) * 22;
    const width = 4 + hash(i + 30) * 9;
    parts.push(new BoxGeometry(width, height, width * (0.7 + hash(i + 40) * 0.6)).translate(Math.cos(angle) * radius, height / 2 - 0.6, Math.sin(angle) * radius));
  }
  const merged = mergeGeometries(parts);
  parts.forEach(part => part.dispose());
  return merged;
}

const TREES: Array<[number, number, number]> = [
  [-10.5, 6.2, 1.1], [-8.6, 7.1, 0.9], [9.8, 6.4, 1.15], [11.6, 5.1, 0.85],
  [-11.8, -5.6, 1], [10.9, -6.2, 1.05], [-3.4, 7.4, 0.8], [3.9, 7.5, 0.85],
];

function createTrees() {
  const crowns: BufferGeometry[] = [];
  const trunks: BufferGeometry[] = [];
  for (const [x, z, s] of TREES) {
    crowns.push(new IcosahedronGeometry(1.15 * s, 1).scale(1, 1.15, 1).translate(x, 1.9 * s + 0.4, z));
    trunks.push(new CylinderGeometry(0.09 * s, 0.12 * s, 1.4 * s, 6).translate(x, 0.7 * s, z));
  }
  const result = { crowns: mergeGeometries(crowns), trunks: mergeGeometries(trunks) };
  [...crowns, ...trunks].forEach(part => part.dispose());
  return result;
}

export const SkyDome = memo(function SkyDome() {
  return <mesh scale={260} renderOrder={-1}>
    <sphereGeometry args={[1, 32, 16]} />
    <shaderMaterial vertexShader={skyVertex} fragmentShader={skyFragment} side={BackSide} depthWrite={false} fog={false} />
  </mesh>;
});

export const Skyline = memo(function Skyline() {
  const geometry = useMemo(createSkyline, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}>
    <meshStandardMaterial color="#141c29" roughness={0.9} />
  </mesh>;
});

export const Plaza = memo(function Plaza({ primary = true }: { primary?: boolean }) {
  const trees = useMemo(createTrees, []);
  useEffect(() => () => { trees.crowns.dispose(); trees.trunks.dispose(); }, [trees]);
  return <group>
    <mesh position={[0, -0.25, 0]} receiveShadow={primary}>
      <boxGeometry args={[PLAZA_WIDTH, 0.5, PLAZA_DEPTH]} />
      <meshStandardMaterial color="#1c222b" roughness={0.85} />
    </mesh>
    {/* A lighter paved apron around the podium entrance. */}
    <mesh position={[0, 0.005, 0]} rotation-x={-Math.PI / 2} receiveShadow={primary}>
      <planeGeometry args={[PODIUM_WIDTH + 3, PODIUM_DEPTH + 3]} />
      <meshStandardMaterial color="#2a2f37" roughness={0.8} />
    </mesh>
    <mesh geometry={trees.crowns} castShadow={primary}>
      <meshStandardMaterial color="#1e3324" roughness={0.95} flatShading />
    </mesh>
    <mesh geometry={trees.trunks}>
      <meshStandardMaterial color="#2a1f17" roughness={1} />
    </mesh>
  </group>;
});
