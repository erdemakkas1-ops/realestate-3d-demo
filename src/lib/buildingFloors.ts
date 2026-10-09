import { Box3, Vector3 } from "three";
import {
  FLOOR_COUNT,
  FLOOR_END_RATIO,
  FLOOR_START_RATIO,
  TOWER_DEPTH_RATIO,
  TOWER_CENTER_X_OFFSET_RATIO,
  TOWER_CENTER_Z_OFFSET_RATIO,
  TOWER_WIDTH_RATIO,
} from "./glbBuildingConfig";

export type BuildingFloor = {
  floorNumber: number;
  center: [number, number, number];
  size: [number, number, number];
};

export function createBuildingFloors(worldBounds: Box3): BuildingFloor[] {
  if (
    !Number.isInteger(FLOOR_COUNT) || FLOOR_COUNT < 1 ||
    !Number.isFinite(FLOOR_START_RATIO) || !Number.isFinite(FLOOR_END_RATIO) ||
    FLOOR_START_RATIO < 0 || FLOOR_END_RATIO > 1 || FLOOR_START_RATIO >= FLOOR_END_RATIO ||
    TOWER_WIDTH_RATIO <= 0 || TOWER_DEPTH_RATIO <= 0 ||
    TOWER_WIDTH_RATIO > 1 || TOWER_DEPTH_RATIO > 1
    || !Number.isFinite(TOWER_CENTER_X_OFFSET_RATIO) || !Number.isFinite(TOWER_CENTER_Z_OFFSET_RATIO)
  ) {
    throw new Error("Kat konfigürasyonu geçersiz: 0 ≤ başlangıç < bitiş ≤ 1 olmalı.");
  }

  const size = worldBounds.getSize(new Vector3());
  const center = worldBounds.getCenter(new Vector3());
  const towerCenterX = center.x + size.x * TOWER_CENTER_X_OFFSET_RATIO;
  const towerCenterZ = center.z + size.z * TOWER_CENTER_Z_OFFSET_RATIO;
  const startY = worldBounds.min.y + size.y * FLOOR_START_RATIO;
  const floorHeight = size.y * (FLOOR_END_RATIO - FLOOR_START_RATIO) / FLOOR_COUNT;

  return Array.from({ length: FLOOR_COUNT }, (_, index) => ({
    floorNumber: index + 1,
    center: [towerCenterX, startY + (index + 0.5) * floorHeight, towerCenterZ],
    // The full bounds still determine vertical placement and center; tower ratios
    // keep surrounding podium, trees, cars, and landscape out of the hit area.
    size: [size.x * TOWER_WIDTH_RATIO, floorHeight, size.z * TOWER_DEPTH_RATIO],
  }));
}
