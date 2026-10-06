"use client";

import { Component, Suspense, useLayoutEffect, useRef, type ComponentRef, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { countAvailable } from "@/data/apartments";
import { TOWER_TOP, buildingFloors } from "@/lib/buildingLayout";
import { WATER_LEVEL } from "@/lib/buildingConfig";
import { useTouchOrbit } from "@/lib/useTouchOrbit";
import FloorHitboxes from "./FloorHitboxes";
import Tower, { type UnitHighlight } from "./Tower";
import { Plaza, SkyDome, Skyline } from "./Surroundings";
import ViewerStatus from "./ViewerStatus";

type Props = {
  hoveredFloor: number | null;
  selectedFloor: number | null;
  highlight: UnitHighlight;
  onHoverChange: Dispatch<SetStateAction<number | null>>;
  onSelect: (floor: number) => void;
};

const TARGET: [number, number, number] = [0, TOWER_TOP * 0.5, 0];
const START_AZIMUTH = 0.5;
const START_ELEVATION = 0.1;

function floorLabel(floorNumber: number) {
  const available = countAvailable(floorNumber);
  return { title: `${floorNumber}. Kat`, detail: available ? `${available} daire müsait` : "Tüm daireler satıldı" };
}

/** Fits the tower to the viewport and, on wide screens, shifts it right of the hero copy. */
function CameraRig() {
  const { camera, size, invalidate } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const initialized = useRef(false);
  useTouchOrbit(controls);
  const wide = size.width >= 1024;

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const halfV = MathUtils.degToRad(camera.fov / 2);
    // Narrower desktops give the copy column more room, so the tower moves further right.
    const shift = size.width < 1280 ? 0.23 : 0.17;
    const visibleWidth = wide ? size.width * (1 - shift * 2.2) : size.width;
    const halfH = Math.atan(Math.tan(halfV) * visibleWidth / Math.max(size.height, 1));
    // Frame the tower and its podium; the plaza and skyline may bleed off the edges.
    const distance = Math.max((TOWER_TOP * 0.82) / Math.tan(halfV), (wide ? 11 : 13.5) / Math.tan(halfH));
    if (!initialized.current) {
      camera.position.set(
        TARGET[0] + Math.sin(START_AZIMUTH) * Math.cos(START_ELEVATION) * distance,
        TARGET[1] + Math.sin(START_ELEVATION) * distance,
        TARGET[2] + Math.cos(START_AZIMUTH) * Math.cos(START_ELEVATION) * distance,
      );
      initialized.current = true;
    } else {
      const target = new Vector3(...TARGET);
      camera.position.copy(target).add(camera.position.clone().sub(target).setLength(distance));
    }
    if (wide) camera.setViewOffset(size.width, size.height, -size.width * shift, 0, size.width, size.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    controls.current?.update();
    invalidate();
  }, [camera, size.width, size.height, wide, invalidate]);

  return <OrbitControls
    ref={controls}
    makeDefault
    target={TARGET}
    enableZoom={false}
    enablePan={false}
    enableDamping
    dampingFactor={0.08}
    rotateSpeed={0.45}
    minPolarAngle={Math.PI * 0.4}
    maxPolarAngle={Math.PI * 0.495}
    minAzimuthAngle={-1.15}
    maxAzimuthAngle={1.15}
  />;
}

/** Sun, sky and building are static, so the shadow map is drawn on the first frames only. */
function StaticShadows() {
  const get = useThree(state => state.get);
  const frames = useRef(0);
  useLayoutEffect(() => {
    const { gl, invalidate } = get();
    gl.shadowMap.autoUpdate = false;
    invalidate();
  }, [get]);
  useFrame(state => {
    // Several frames: the Environment's own first render also consumes needsUpdate.
    if (frames.current >= 3) return;
    frames.current += 1;
    state.gl.shadowMap.needsUpdate = true;
    state.invalidate();
  });
  return null;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ViewerStatus error /> : this.props.children; }
}

export default function HeroCanvas({ hoveredFloor, selectedFloor, highlight, onHoverChange, onSelect }: Props) {
  return <CanvasErrorBoundary><Suspense fallback={<ViewerStatus />}>
    <Canvas
      camera={{ fov: 30, near: 0.5, far: 700 }}
      dpr={[1, 1.75]}
      frameloop="demand"
      shadows="percentage"
      gl={{ antialias: true, alpha: false }}
      fallback={<p className="p-6 text-sm text-[#aab5c4]">3D bina için WebGL destekli bir tarayıcı gerekiyor.</p>}
      style={{ width: "100%", height: "100%" }}
    >
      <fog attach="fog" args={["#1d2737", 70, 210]} />
      <hemisphereLight args={["#7389ad", "#2a2119", 0.85]} />
      <directionalLight
        position={[16, 24, 20]}
        intensity={1.5}
        color="#ffe3c6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={20}
        shadow-camera-bottom={-12}
        shadow-camera-near={5}
        shadow-camera-far={80}
      />
      {/* Sunset behind the skyline rims the tower in orange. */}
      <directionalLight position={[-18, 7, -30]} intensity={1.6} color="#ff9650" />
      <Environment resolution={128} frames={1} environmentIntensity={0.7}>
        <color attach="background" args={["#141d2b"]} />
        <Lightformer form="rect" intensity={2.4} color="#ff9b5a" position={[-6, 1.5, -20]} scale={[60, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#6f87ad" position={[0, 20, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#a9b8d0" position={[20, 4, 16]} scale={[20, 6, 1]} target={[0, 0, 0]} />
      </Environment>

      <SkyDome />
      <Skyline />
      <Plaza />
      <Tower highlight={highlight} />
      <FloorHitboxes floors={buildingFloors} getLabel={floorLabel} hoveredFloor={hoveredFloor} selectedFloor={selectedFloor} onHoverChange={onHoverChange} onSelect={onSelect} />

      {/* Water: a mirrored copy of the scene seen through a dark, slightly transparent surface. */}
      <group position={[0, WATER_LEVEL * 2, 0]} scale={[1, -1, 1]}>
        <Skyline />
        <Plaza primary={false} />
        <Tower highlight={highlight} primary={false} />
      </group>
      <mesh position={[0, WATER_LEVEL, 0]} rotation-x={-Math.PI / 2} renderOrder={1}>
        <planeGeometry args={[700, 700]} />
        <meshStandardMaterial color="#0a1422" roughness={0.3} metalness={0.2} transparent opacity={0.62} />
      </mesh>

      <CameraRig />
      <StaticShadows />
    </Canvas>
  </Suspense></CanvasErrorBoundary>;
}
