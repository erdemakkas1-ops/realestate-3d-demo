"use client";

import { Component, Suspense, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import BuildingModel from "./BuildingModel";
import ViewerStatus from "./ViewerStatus";

type Props = {
  hoveredFloor: number | null;
  selectedFloor: number | null;
  onHoverChange: Dispatch<SetStateAction<number | null>>;
  onSelect: (floor: number) => void;
};

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ViewerStatus error /> : this.props.children; }
}

export default function BuildingCanvas({ hoveredFloor, selectedFloor, onHoverChange, onSelect }: Props) {
  return <>
    <CanvasErrorBoundary><Suspense fallback={<ViewerStatus />}>
      <Canvas
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: false }}
        camera={{ position: [0, 1, 5], fov: 40 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        shadows="percentage"
        fallback={<p className="p-6 text-sm text-[#aab5c4]">3D bina için WebGL destekli bir tarayıcı gerekiyor.</p>}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#050914"]} />
        <hemisphereLight args={["#d6e2f2", "#5c5446", 0.35]} />
        {/* Warm late-afternoon sun and a cool sky fill. */}
        <directionalLight
          position={[5, 6, 4]}
          intensity={3.2}
          color="#ffe9cf"
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
        <directionalLight position={[-5, 3, -4]} intensity={0.5} color="#b9c9e6" />
        {/* Procedural sky for glass reflections; rendered once, no HDR download. */}
        <Environment resolution={256} frames={1} environmentIntensity={0.55}>
          <color attach="background" args={["#56657a"]} />
          <Lightformer form="rect" intensity={1.1} color="#c9d8ee" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
          <Lightformer form="rect" intensity={1.6} color="#ffd9ad" position={[6, 1.2, 5]} scale={[10, 2.2, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={0.7} color="#8fa7c9" position={[-7, 1.5, -2]} scale={[10, 3, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={0.25} color="#3b4250" position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
        </Environment>
        <BuildingModel hoveredFloor={hoveredFloor} selectedFloor={selectedFloor} onHoverChange={onHoverChange} onSelect={onSelect} />
      </Canvas>
    </Suspense></CanvasErrorBoundary>
  </>;
}
