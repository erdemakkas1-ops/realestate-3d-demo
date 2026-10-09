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

// Distant city silhouette behind the transparent canvas (generated once, deterministic).
const SKYLINE = "M0 400V322h58V400Z M66 400V326h92V400Z M159 400V253h70V400Z M229 400V314h69V400Z M298 400V322h74V400Z M376 400V267h71V400Z M448 400V259h89V400Z M538 400V277h66V400Z M607 400V355h60V400Z M668 400V361h45V400Z M715 400V348h90V400Z M813 400V358h64V400Z M880 400V347h56V400Z M946 400V333h65V400Z M1019 400V357h80V400Z M1102 400V314h60V400Z M1168 400V277h86V400Z M1264 400V283h85V400Z M1355 400V341h93V400Z M1448 400V255h84V400Z M1539 400V235h75V400Z";
const SKYLINE_LIGHTS = "M18 332h5v6h-5Z M42 332h5v6h-5Z M42 346h5v6h-5Z M42 360h5v6h-5Z M6 388h5v6h-5Z M30 388h5v6h-5Z M96 336h5v6h-5Z M108 350h5v6h-5Z M120 350h5v6h-5Z M165 277h5v6h-5Z M201 291h5v6h-5Z M213 291h5v6h-5Z M189 305h5v6h-5Z M189 389h5v6h-5Z M247 324h5v6h-5Z M235 352h5v6h-5Z M259 366h5v6h-5Z M283 366h5v6h-5Z M235 380h5v6h-5Z M283 380h5v6h-5Z M340 332h5v6h-5Z M352 346h5v6h-5Z M364 388h5v6h-5Z M394 347h5v6h-5Z M406 347h5v6h-5Z M418 361h5v6h-5Z M418 375h5v6h-5Z M478 269h5v6h-5Z M514 269h5v6h-5Z M466 297h5v6h-5Z M502 297h5v6h-5Z M490 311h5v6h-5Z M490 325h5v6h-5Z M466 367h5v6h-5Z M454 381h5v6h-5Z M478 381h5v6h-5Z M490 381h5v6h-5Z M514 381h5v6h-5Z M580 329h5v6h-5Z M544 343h5v6h-5Z M613 365h5v6h-5Z M686 371h5v6h-5Z M674 385h5v6h-5Z M793 372h5v6h-5Z M721 386h5v6h-5Z M793 386h5v6h-5Z M831 368h5v6h-5Z M922 357h5v6h-5Z M898 371h5v6h-5Z M922 385h5v6h-5Z M976 371h5v6h-5Z M1000 371h5v6h-5Z M988 385h5v6h-5Z M1049 367h5v6h-5Z M1085 367h5v6h-5Z M1073 381h5v6h-5Z M1108 324h5v6h-5Z M1132 338h5v6h-5Z M1108 352h5v6h-5Z M1132 352h5v6h-5Z M1144 352h5v6h-5Z M1186 315h5v6h-5Z M1174 329h5v6h-5Z M1186 329h5v6h-5Z M1246 329h5v6h-5Z M1174 343h5v6h-5Z M1234 343h5v6h-5Z M1186 357h5v6h-5Z M1246 371h5v6h-5Z M1198 385h5v6h-5Z M1330 293h5v6h-5Z M1282 321h5v6h-5Z M1318 321h5v6h-5Z M1318 335h5v6h-5Z M1330 335h5v6h-5Z M1330 349h5v6h-5Z M1306 391h5v6h-5Z M1342 391h5v6h-5Z M1397 351h5v6h-5Z M1409 351h5v6h-5Z M1502 265h5v6h-5Z M1502 321h5v6h-5Z M1454 335h5v6h-5Z M1514 349h5v6h-5Z M1478 391h5v6h-5Z M1490 391h5v6h-5Z M1545 245h5v6h-5Z M1557 259h5v6h-5Z M1605 273h5v6h-5Z M1581 301h5v6h-5Z M1593 301h5v6h-5Z M1593 315h5v6h-5Z M1593 343h5v6h-5Z M1545 371h5v6h-5Z";

// Dusk dome inside the Environment so the glass reflects sky, not a void.
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
    vec3 zenith = vec3(0.04, 0.07, 0.17);
    vec3 horizon = vec3(0.78, 0.45, 0.32);
    vec3 ground = vec3(0.05, 0.05, 0.06);
    vec3 color = h > 0.0 ? mix(horizon, zenith, pow(h, 0.45)) : mix(horizon, ground, pow(-h, 0.35));
    gl_FragColor = vec4(color, 1.0);
  }
`;

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ViewerStatus error /> : this.props.children; }
}

export default function BuildingCanvas({ hoveredFloor, selectedFloor, onHoverChange, onSelect }: Props) {
  return <div className="relative h-full w-full" style={{ background: "linear-gradient(180deg, #0b1330 0%, #1d2550 38%, #4d3d66 62%, #a5626a 80%, #e08a5c 92%, #f0a865 100%)" }}>
    <svg aria-hidden="true" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-x-0 bottom-[16%] h-[20%] w-full opacity-80">
      <path d={SKYLINE} fill="#1a1838" />
      <path d={SKYLINE_LIGHTS} fill="#f3c27c" opacity="0.55" />
    </svg>
    <CanvasErrorBoundary><Suspense fallback={<ViewerStatus />}>
      <Canvas
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        camera={{ position: [0, 1, 5], fov: 40 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        shadows="percentage"
        fallback={<p className="p-6 text-sm text-[#aab5c4]">3D bina için WebGL destekli bir tarayıcı gerekiyor.</p>}
        style={{ width: "100%", height: "100%" }}
      >
        <hemisphereLight args={["#5d6ca3", "#1b1612", 0.5]} />
        {/* Soft, near-neutral evening light on the facade; the lit interiors carry the image. */}
        <directionalLight
          position={[5, 6, 4]}
          intensity={1.15}
          color="#dcd8ea"
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
        {/* Sunset behind the city rims the tower in orange. */}
        <directionalLight position={[-5, 2.5, -5]} intensity={0.8} color="#ff9a5c" />
        <Environment resolution={256} frames={1} environmentIntensity={0.6}>
          <mesh scale={50}>
            <sphereGeometry args={[1, 32, 16]} />
            <shaderMaterial side={BackSide} depthWrite={false} vertexShader={skyVertex} fragmentShader={skyFragment} />
          </mesh>
          <Lightformer form="rect" intensity={1.4} color="#ff9e66" position={[-6, 1, -8]} scale={[16, 2, 1]} target={[0, 0, 0]} />
        </Environment>
        <BuildingModel hoveredFloor={hoveredFloor} selectedFloor={selectedFloor} onHoverChange={onHoverChange} onSelect={onSelect} />
      </Canvas>
    </Suspense></CanvasErrorBoundary>
  </div>;
}
