import { Locks, SceneObject } from "../types";

export const DOC_TITLE = "Chair Concept v3";

export const NO_LOCK: Locks = {
  pos: [false, false, false],
  rot: [false, false, false],
  scl: [false, false, false],
};

const IDENTITY = { rot: [0, 0, 0], scl: [1, 1, 1] } as const;

/** The sample chair every screen works on. */
export const INITIAL_OBJECTS: SceneObject[] = [
  {
    id: "seat",
    name: "Seat Base",
    color: "#8b6cff",
    xform: { pos: [0, 0, 65], rot: [0, 0, 12], scl: [1, 1, 1] },
    geo: {
      kind: "extrude",
      pts: [
        { x: -60, y: -50, t: "corner" },
        { x: 60, y: -50, t: "corner" },
        { x: 60, y: 40, t: "corner" },
        { x: 30, y: 50, t: "corner" },
        { x: -30, y: 50, t: "corner" },
        { x: -60, y: 30, t: "corner" },
      ],
      depth: 40,
      bevel: 2.5,
      seg: 12,
    },
  },
  {
    id: "backrest",
    name: "Backrest",
    color: "#1fb5cc",
    xform: { pos: [0, 55, 160], ...IDENTITY } as SceneObject["xform"],
    geo: { kind: "box", size: [120, 110, 10] },
  },
  {
    id: "legFL",
    name: "Leg · Front L",
    color: "#2b2542",
    xform: { pos: [-48, 38, 40], ...IDENTITY } as SceneObject["xform"],
    geo: { kind: "box", size: [12, 50, 12] },
  },
  {
    id: "legFR",
    name: "Leg · Front R",
    color: "#2b2542",
    xform: { pos: [48, 38, 40], ...IDENTITY } as SceneObject["xform"],
    geo: { kind: "box", size: [12, 50, 12] },
  },
  {
    id: "legBack",
    name: "Leg · Back",
    color: "#2b2542",
    xform: { pos: [0, -38, 40], ...IDENTITY } as SceneObject["xform"],
    geo: {
      kind: "box",
      size: [12, 50, 12],
      copies: [
        [-48, 0, 0],
        [48, 0, 0],
      ],
    },
    locked: true,
  },
];

// Default extrude settings for outlines extruded from the Sketch screen
export const NEW_EXTRUDE = { depth: 20, bevel: 1, seg: 12 };

// Colors cycled through for newly added objects
export const SHAPE_PALETTE = [
  "#8b6cff",
  "#22d3ee",
  "#f472b6",
  "#fbbf24",
  "#a3e635",
  "#60a5fa",
];

// Swatches in the Material section of the inspector
export const MATERIAL_SWATCHES = [
  "#8b6cff",
  "#4ad7f0",
  "#f472b6",
  "#fbbf24",
  "#a3e635",
  "#e8e9f0",
];

// Layer swatch for imported models (they keep their own materials)
export const IMPORT_SWATCH = "#e8e9f0";
