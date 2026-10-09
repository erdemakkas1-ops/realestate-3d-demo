"use client";

import { Component, Suspense, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { BackSide } from "three";
import BuildingModel from "./BuildingModel";
import ViewerStatus from "./ViewerStatus";

type Props = {
  hoveredFloor: number | null;
  selectedFloor: number | null;
  onHoverChange: Dispatch<SetStateAction<number | null>>;
  onSelect: (floor: number) => void;
};

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
    vec3 zenith = vec3(0.24, 0.47, 0.78);
    vec3 horizon = vec3(0.88, 0.93, 0.97);
    vec3 ground = vec3(0.36, 0.42, 0.30);
    vec3 color = h > 0.0 ? mix(horizon, zenith, pow(h, 0.55)) : mix(horizon, ground, pow(-h, 0.4));
    gl_FragColor = vec4(color, 1.0);
  }
`;

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ViewerStatus error /> : this.props.children; }
}

export default function BuildingCanvas({ hoveredFloor, selectedFloor, onHoverChange, onSelect }: Props) {
  return <>
    <CanvasErrorBoundary><Suspense fallback={<ViewerStatus />}>
      <Canvas
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        camera={{ position: [0, 1, 5], fov: 40 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        shadows="percentage"
        fallback={<p className="p-6 text-sm text-[#aab5c4]">3D bina için WebGL destekli bir tarayıcı gerekiyor.</p>}
        style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #4f8fd1 0%, #8fbde6 46%, #d9e8f2 78%, #f3dcc0 100%)" }}
      >
        <hemisphereLight args={["#bfdcff", "#6b7f4a", 0.9]} />
        {/* Bright afternoon sun from the front-right, plus a cool sky bounce from behind. */}
        <directionalLight
          position={[5, 7, 4]}
          intensity={2.9}
          color="#fff3e2"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.004}
          shadow-camera-left={-1.6}
          shadow-camera-right={1.6}
          shadow-camera-top={1.6}
          shadow-camera-bottom={-1.6}
          shadow-camera-near={1}
          shadow-camera-far={20}
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.8} color="#cfe3ff" />
        {/* Procedural daylight sky for glass reflections; rendered once, no HDR download. */}
        <Environment resolution={256} frames={1} environmentIntensity={1}>
          {/* A real gradient dome (zenith blue → pale horizon → green-grey ground) so the glass reflects sky, not a void. */}
          <mesh scale={50}>
            <sphereGeometry args={[1, 32, 16]} />
            <shaderMaterial side={BackSide} depthWrite={false} vertexShader={skyVertex} fragmentShader={skyFragment} />
          </mesh>
          <Lightformer form="rect" intensity={2.4} color="#d9ebff" position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[16, 16, 1]} />
          <Lightformer form="ring" intensity={2.6} color="#f4f8ff" position={[0, 0.6, 0]} rotation-x={Math.PI / 2} scale={[9, 9, 1]} />
          <Lightformer form="rect" intensity={3} color="#fff0d6" position={[6, 2, 5]} scale={[4, 4, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={0.6} color="#6f7f55" position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[16, 16, 1]} />
        </Environment>
        <BuildingModel hoveredFloor={hoveredFloor} selectedFloor={selectedFloor} onHoverChange={onHoverChange} onSelect={onSelect} />
      </Canvas>
    </Suspense></CanvasErrorBoundary>
  </>;
}
