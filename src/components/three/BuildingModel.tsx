"use client";

import { memo, useLayoutEffect, useMemo, useRef, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, MathUtils, PerspectiveCamera, Sphere, Vector3, type Mesh } from "three";
import FloorHitboxes, { type FloorInteractionProps } from "./FloorHitboxes";
import { TOWER_WIDTH_RATIO, TOWER_DEPTH_RATIO } from "@/lib/glbBuildingConfig";
import { createBuildingFloors } from "@/lib/buildingFloors";
import { countAvailable } from "@/data/apartments";
import { useTouchOrbit } from "@/lib/useTouchOrbit";

// Same geometry as building.glb, split into PBR material groups by scripts/colorize_building.py.
const MODEL_URL = "/models/building-colored.glb";
useGLTF.preload(MODEL_URL);

function floorLabel(floor: number) {
  const available = countAvailable(floor);
  return { title: `${floor}. Kat`, detail: available ? `${available} daire müsait` : "Tüm daireler satıldı" };
}

export default memo(function BuildingModel(interaction: FloorInteractionProps) {
  const { scene } = useGLTF(MODEL_URL);
  const { camera, gl, size, invalidate } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  useTouchOrbit(controls);
  const initialized = useRef(false);

  const { center, radius, worldBounds } = useMemo(() => {
    scene.traverse(object => {
      if ((object as Mesh).isMesh) { object.castShadow = true; object.receiveShadow = true; }
    });
    scene.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(scene, true);
    const sphere = bounds.getBoundingSphere(new Sphere());
    if (bounds.isEmpty() || !Number.isFinite(sphere.radius) || sphere.radius <= 0) {
      throw new Error("Modelin görünür geometrisi veya geçerli sınırları yok.");
    }
    // Match the model's centering group so the hitboxes use displayed world coordinates.
    const worldBounds = bounds.clone().translate(sphere.center.clone().negate());
    return { center: sphere.center, radius: sphere.radius, worldBounds };
  }, [scene]);
  const floors = useMemo(() => createBuildingFloors(worldBounds), [worldBounds]);

  // Frame the tower, not the landscape contained in the same GLB mesh.
  const verticalFov = MathUtils.degToRad(camera instanceof PerspectiveCamera ? camera.fov : 40);
  const wide = window.matchMedia("(min-width: 1024px)").matches;
  const viewShift = wide ? (size.width < 1280 ? 0.23 : 0.17) : 0;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * size.width * (1 - viewShift * 2.2) / Math.max(size.height, 1));
  const dimensions = worldBounds.getSize(new Vector3());
  const viewDirection = new Vector3(0.3, 0.18, 1).normalize();
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), viewDirection).normalize();
  const up = new Vector3().crossVectors(viewDirection, right).normalize();
  let fitDistance = 0;
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const corner = new Vector3(x * dimensions.x * TOWER_WIDTH_RATIO / 2, y * dimensions.y / 2, z * dimensions.z * TOWER_DEPTH_RATIO / 2);
    fitDistance = Math.max(fitDistance, corner.dot(viewDirection) + Math.max(Math.abs(corner.dot(right)) / Math.tan(horizontalFov / 2), Math.abs(corner.dot(up)) / Math.tan(verticalFov / 2)));
  }
  const minDistance = fitDistance * 0.9;
  const maxDistance = fitDistance * 2.2;

  // R3F owns a mutable Three.js camera; imperative updates belong in this effect.
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const direction = initialized.current
      ? camera.position.clone().normalize()
      : new Vector3(0.3, 0.18, 1).normalize();
    const distance = initialized.current
      ? MathUtils.clamp(camera.position.length(), minDistance, maxDistance)
      : fitDistance * 1.06;
    camera.position.copy(direction.multiplyScalar(distance));
    camera.near = Math.max(radius / 100, 0.001);
    camera.far = maxDistance + radius * 4;
    if (wide) camera.setViewOffset(size.width, size.height, -size.width * viewShift, 0, size.width, size.height);
    else camera.clearViewOffset();
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    initialized.current = true;
    invalidate();
  }, [camera, fitDistance, minDistance, maxDistance, radius, invalidate, wide, viewShift, size.width, size.height]);

  // The sun and the building never move, so the shadow map is rendered on the first frames only,
  // not on every orbit frame. Several frames, because the Environment's own first render also
  // consumes the needsUpdate flag.
  const shadowFrames = useRef(0);
  useLayoutEffect(() => {
    gl.shadowMap.autoUpdate = false;
    shadowFrames.current = 0;
    invalidate();
  }, [gl, scene, invalidate]);
  useFrame(() => {
    if (shadowFrames.current >= 3) return;
    shadowFrames.current += 1;
    gl.shadowMap.needsUpdate = true;
    invalidate();
  });

  return <>
    <group position={[-center.x, -center.y, -center.z]}>
      <primitive object={scene} dispose={null} />
    </group>
    <FloorHitboxes floors={floors} getLabel={floorLabel} {...interaction} />
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      // The hero sits in a scrolling page: the wheel must scroll, not zoom.
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      minPolarAngle={Math.PI * 0.34}
      maxPolarAngle={Math.PI * 0.52}
      minDistance={minDistance}
      maxDistance={maxDistance}
      target={[0, 0, 0]}
    />
  </>;
});
