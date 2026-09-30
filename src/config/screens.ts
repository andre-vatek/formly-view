import { ScreenId } from "../types";

// Tool rail: [label, screen it opens (null = no-op), SVG icon path]
export const NAV: [string, ScreenId | null, string][] = [
  ["Select", null, "M5 3l12 6-5 2-2 5z"],
  ["Pen", "06", "M14 4l6 6L9 21H3v-6z"],
  ["Extrude", "05", "M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4"],
  ["Vertices", "07", "M12 4l9 16H3z"],
  [
    "Camera",
    "08",
    "M20 12a8 8 0 01-14 5M4 12a8 8 0 0114-5M18 3v4h-4M6 21v-4h4",
  ],
];

// Top-bar segmented control: [label, screen]
export const TABS: [string, ScreenId][] = [
  ["Sketch 2D", "06"],
  ["Model 3D", "05"],
  ["Edit Vertices", "07"],
];

export type ScreenMeta = {
  /** Index into TABS that is highlighted */
  tab: number;
  hint: string;
};

export const SCREENS: Record<ScreenId, ScreenMeta> = {
  "05": {
    tab: 1,
    hint: "W move · E rotate · R scale · drag to orbit · Del deletes",
  },
  "06": {
    tab: 0,
    hint: "Click to add a point after the active one · drag to move · snaps to 10 mm",
  },
  "07": {
    tab: 2,
    hint: "Click a vertex · Shift adds · drag the gizmo · Apply to keep",
  },
  "08": {
    tab: 1,
    hint: "Drag to orbit the Perspective view",
  },
};

export const toScreenId = (h: string): ScreenId =>
  (["05", "06", "07", "08"].includes(h) ? h : "05") as ScreenId;
