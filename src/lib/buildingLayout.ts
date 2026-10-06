import {
  FLOOR_COUNT, FLOOR_HEIGHT, FRONT_BAYS, PODIUM_HEIGHT, SIDE_BAYS, TOWER_DEPTH, TOWER_WIDTH,
} from "./buildingConfig";

export type BuildingFloor = {
  floorNumber: number;
  center: [number, number, number];
  size: [number, number, number];
};

export type Facade = "front" | "back" | "east" | "west";

export type FacadeWindow = {
  floor: number;
  /** Apartment letter on that floor: A (west + front-left), B (back), C (east + front-right). */
  unit: "A" | "B" | "C";
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  /** 0–1, stable per window; drives which windows are lit at dusk. */
  seed: number;
};

export const TOWER_TOP = PODIUM_HEIGHT + FLOOR_COUNT * FLOOR_HEIGHT;

export const buildingFloors: BuildingFloor[] = Array.from({ length: FLOOR_COUNT }, (_, index) => ({
  floorNumber: index + 1,
  center: [0, PODIUM_HEIGHT + (index + 0.5) * FLOOR_HEIGHT, 0],
  size: [TOWER_WIDTH + 0.5, FLOOR_HEIGHT, TOWER_DEPTH + 0.5],
}));

function hash(a: number, b: number, c: number) {
  const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

const FACADES: Array<{ facade: Facade; bays: number; span: number }> = [
  { facade: "front", bays: FRONT_BAYS, span: TOWER_WIDTH },
  { facade: "back", bays: FRONT_BAYS, span: TOWER_WIDTH },
  { facade: "east", bays: SIDE_BAYS, span: TOWER_DEPTH },
  { facade: "west", bays: SIDE_BAYS, span: TOWER_DEPTH },
];

function unitFor(facade: Facade, bay: number): FacadeWindow["unit"] {
  if (facade === "back") return "B";
  if (facade === "west") return "A";
  if (facade === "east") return "C";
  return bay < FRONT_BAYS / 2 ? "A" : "C";
}

const OUTSET = 0.03;

export const facadeWindows: FacadeWindow[] = buildingFloors.flatMap(({ floorNumber }) =>
  FACADES.flatMap(({ facade, bays, span }, facadeIndex) => Array.from({ length: bays }, (_, bay) => {
    const along = -span / 2 + (bay + 0.5) * (span / bays);
    const y = PODIUM_HEIGHT + (floorNumber - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.56;
    const position: [number, number, number] =
      facade === "front" ? [along, y, TOWER_DEPTH / 2 + OUTSET]
        : facade === "back" ? [-along, y, -TOWER_DEPTH / 2 - OUTSET]
          : facade === "east" ? [TOWER_WIDTH / 2 + OUTSET, y, -along]
            : [-TOWER_WIDTH / 2 - OUTSET, y, along];
    const rotationY = facade === "front" ? 0 : facade === "back" ? Math.PI : facade === "east" ? Math.PI / 2 : -Math.PI / 2;
    return {
      floor: floorNumber,
      unit: unitFor(facade, bay),
      position,
      rotationY,
      width: (span / bays) * 0.8,
      height: FLOOR_HEIGHT * 0.64,
      seed: hash(floorNumber, facadeIndex, bay),
    };
  })),
);

/** Vertical piers between bays, as [x, z, width, depth] footprints spanning the tower height. */
export const facadePiers: Array<[number, number, number, number]> = [
  ...Array.from({ length: FRONT_BAYS + 1 }, (_, i) => -TOWER_WIDTH / 2 + i * (TOWER_WIDTH / FRONT_BAYS))
    .flatMap(x => [[x, TOWER_DEPTH / 2, 0.12, 0.16], [x, -TOWER_DEPTH / 2, 0.12, 0.16]] as Array<[number, number, number, number]>),
  ...Array.from({ length: SIDE_BAYS - 1 }, (_, i) => -TOWER_DEPTH / 2 + (i + 1) * (TOWER_DEPTH / SIDE_BAYS))
    .flatMap(z => [[TOWER_WIDTH / 2, z, 0.16, 0.12], [-TOWER_WIDTH / 2, z, 0.16, 0.12]] as Array<[number, number, number, number]>),
];
