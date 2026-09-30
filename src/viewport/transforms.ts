import * as THREE from "three";
import { XYZ, Xform } from "../types";
import { D, r2 } from "./helpers";

// The UI uses "Figma space" (Z up, Y into the screen); three.js is Y up.
// Figma X → three X, Figma Y → three −Z, Figma Z → three Y (offset by 15).

/** Figma-space axis i maps to this three.js world axis (0=X, 1=Y, 2=Z). */
export const FIGMA_TO_THREE_AXIS = [0, 2, 1] as const;

/** Write a UI transform onto a three.js object. */
export const applyXf = (h: THREE.Object3D, fx: Xform) => {
  h.position.set(fx.pos[0], fx.pos[2] - 15, -fx.pos[1]);
  h.rotation.set(fx.rot[0] * D, fx.rot[2] * D, -fx.rot[1] * D);
  h.scale.set(fx.scl[0], fx.scl[2], fx.scl[1]);
};

/** Read a three.js object's transform back into UI space. */
export const readXf = (h: THREE.Object3D): Xform => {
  const e = h.rotation,
    s = h.scale;
  return {
    pos: [r2(h.position.x), r2(-h.position.z), r2(h.position.y + 15)],
    rot: [r2(e.x / D), r2(-e.z / D), r2(e.y / D)],
    scl: [r2(s.x), r2(s.z), r2(s.y)],
  };
};

/** three.js world point → Figma-space point (rounded, for display). */
export const threeToFigma = (v: THREE.Vector3): XYZ => [
  r2(v.x),
  r2(-v.z),
  r2(v.y + 15),
];

/** Figma-space offset → three.js offset. */
export const figmaDeltaToThree = (d: XYZ) => new THREE.Vector3(d[0], d[2], -d[1]);

/** three.js offset → Figma-space offset (rounded). */
export const threeDeltaToFigma = (d: THREE.Vector3): XYZ => [
  r2(d.x),
  r2(-d.z),
  r2(d.y),
];
