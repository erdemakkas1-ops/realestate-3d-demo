"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Color, Matrix4, Object3D, PlaneGeometry, type BufferGeometry, type InstancedMesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  FLOOR_COUNT, FLOOR_HEIGHT, PODIUM_DEPTH, PODIUM_HEIGHT, PODIUM_WIDTH, TOWER_DEPTH, TOWER_WIDTH,
} from "@/lib/buildingConfig";
import { TOWER_TOP, facadePiers, facadeWindows, type FacadeWindow } from "@/lib/buildingLayout";

export type UnitHighlight = { floor: number; unit: FacadeWindow["unit"] } | null;

type Box = [x: number, y: number, z: number, w: number, h: number, d: number];

function merge(boxes: Box[]): BufferGeometry {
  const parts = boxes.map(([x, y, z, w, h, d]) => new BoxGeometry(w, h, d).translate(x, y, z));
  const merged = mergeGeometries(parts);
  parts.forEach(part => part.dispose());
  return merged;
}

const SLAB = 0.12;
const BALCONY = 0.45;

function createTowerGeometry() {
  const concrete: Box[] = [];
  for (let floor = 0; floor <= FLOOR_COUNT; floor++) {
    const y = PODIUM_HEIGHT + floor * FLOOR_HEIGHT;
    concrete.push([0, y, 0, TOWER_WIDTH + 0.6, SLAB, TOWER_DEPTH + BALCONY * 2]);
    if (floor > 0 && floor < FLOOR_COUNT) {
      // Balcony handrails along the front and back slab edges.
      for (const side of [1, -1]) concrete.push([0, y + 0.42, side * (TOWER_DEPTH / 2 + BALCONY - 0.02), TOWER_WIDTH + 0.6, 0.035, 0.035]);
    }
  }
  const towerHeight = FLOOR_COUNT * FLOOR_HEIGHT;
  for (const [x, z, w, d] of facadePiers) concrete.push([x, PODIUM_HEIGHT + towerHeight / 2, z, w, towerHeight, d]);
  concrete.push([0, PODIUM_HEIGHT + 0.06, 0, PODIUM_WIDTH + 0.3, SLAB, PODIUM_DEPTH + 0.3]);
  // Roof parapet and the cap of the plant room.
  concrete.push([0, TOWER_TOP + 0.25, 0, TOWER_WIDTH + 0.6, 0.4, TOWER_DEPTH + BALCONY * 2]);
  concrete.push([0.6, TOWER_TOP + 1.65, 0, 4.4, 0.1, 3.4]);

  const glass: Box[] = [[0, PODIUM_HEIGHT + towerHeight / 2, 0, TOWER_WIDTH, towerHeight, TOWER_DEPTH]];
  const timber: Box[] = [[0, PODIUM_HEIGHT - 0.5, 0, PODIUM_WIDTH, 0.9, PODIUM_DEPTH]];
  const storefront: Box[] = [[0, 0.75, 0, PODIUM_WIDTH - 0.5, 1.5, PODIUM_DEPTH - 0.5]];
  const roof: Box[] = [[0.6, TOWER_TOP + 1, 0, 4, 1.3, 3]];
  return { concrete: merge(concrete), glass: merge(glass), timber: merge(timber), storefront: merge(storefront), roof: merge(roof) };
}

const WARM = ["#f7c47c", "#f3d3a2", "#eaa45d", "#fbe2b6"].map(value => new Color(value));
const HIGHLIGHT = new Color("#ffd27d").multiplyScalar(1.35);
const LIT_SHARE = 0.3;

// `primary` is false for the mirrored copy used as the water reflection: no shadow work there.
export default memo(function Tower({ highlight = null, primary = true }: { highlight?: UnitHighlight; primary?: boolean }) {
  const geometry = useMemo(createTowerGeometry, []);
  const windowGeometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const windows = useRef<InstancedMesh>(null);
  useEffect(() => () => {
    Object.values(geometry).forEach(part => part.dispose());
    windowGeometry.dispose();
  }, [geometry, windowGeometry]);

  useLayoutEffect(() => {
    const mesh = windows.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const matrix = new Matrix4();
    let count = 0;
    for (const pane of facadeWindows) {
      const selected = highlight !== null && pane.floor === highlight.floor && pane.unit === highlight.unit;
      if (!selected && pane.seed > LIT_SHARE) continue;
      dummy.position.set(...pane.position);
      dummy.rotation.set(0, pane.rotationY, 0);
      dummy.scale.set(pane.width, pane.height, 1);
      dummy.updateMatrix();
      matrix.copy(dummy.matrix);
      mesh.setMatrixAt(count, matrix);
      mesh.setColorAt(count, selected ? HIGHLIGHT : WARM[Math.floor(pane.seed * 97) % WARM.length]);
      count++;
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [highlight]);

  return <group>
    <mesh geometry={geometry.glass} castShadow={primary} receiveShadow={primary}>
      <meshStandardMaterial color="#3a4d63" metalness={0.25} roughness={0.22} envMapIntensity={1.6} />
    </mesh>
    <mesh geometry={geometry.concrete} castShadow={primary} receiveShadow={primary}>
      <meshStandardMaterial color="#e8e2d6" roughness={0.72} />
    </mesh>
    <mesh geometry={geometry.timber} castShadow={primary} receiveShadow={primary}>
      <meshStandardMaterial color="#9b6236" roughness={0.6} />
    </mesh>
    <mesh geometry={geometry.storefront}>
      <meshBasicMaterial color="#b97a40" toneMapped={false} />
    </mesh>
    <mesh geometry={geometry.roof} castShadow={primary} receiveShadow={primary}>
      <meshStandardMaterial color="#2b313a" roughness={0.5} metalness={0.3} />
    </mesh>
    <instancedMesh ref={windows} args={[windowGeometry, undefined, facadeWindows.length]} frustumCulled={false}>
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  </group>;
});
