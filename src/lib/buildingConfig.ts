// Procedural tower dimensions in scene units (1 unit ≈ one storey height ≈ 3.2 m).
export const FLOOR_COUNT = 14;
export const FLOOR_HEIGHT = 1;
export const TOWER_WIDTH = 9;   // x, front/back facade
export const TOWER_DEPTH = 6;   // z, side facades
export const PODIUM_HEIGHT = 2.4;
export const PODIUM_WIDTH = 15;
export const PODIUM_DEPTH = 9.5;
export const PLAZA_WIDTH = 26;
export const PLAZA_DEPTH = 17;
export const WATER_LEVEL = -0.45;

// Window bays per facade; apartments own whole bays (see buildingLayout.ts).
export const FRONT_BAYS = 8;
export const SIDE_BAYS = 5;

export const HIGHLIGHT_PADDING = 1.04;
export const HIGHLIGHT_HEIGHT_RATIO = 0.8;
