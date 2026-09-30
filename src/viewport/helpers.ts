import * as THREE from "three";
import { Curve } from "../types";

/** Degrees → radians factor */
export const D = Math.PI / 180;

/** Round to 2 decimals (for values reported back to the UI). */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/** A render target: camera + normalized [x, y, w, h] rect (y from top). */
export type View = { cam: THREE.Camera; r: [number, number, number, number] };

/** Orthographic camera whose half-height is `s`; the frustum is fitted per frame. */
export const ortho = (s: number) => {
  const c = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
  c.userData.s = s;
  return c;
};

export const std = (c: number | string) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.1 });

/** Soft-selection falloff curves, w in [0, 1]. */
export const CURVE: Record<Curve, (w: number) => number> = {
  smooth: (w) => w * w * (3 - 2 * w),
  linear: (w) => w,
  sharp: (w) => w * w,
  root: Math.sqrt,
};

/** Keyboard shortcuts for the transform gizmo. */
export const GIZMO_MODES: Record<string, "translate" | "rotate" | "scale"> = {
  w: "translate",
  e: "rotate",
  r: "scale",
};

/** Pointer event → normalized device coordinates for raycasting. */
export const toNdc = (e: PointerEvent, dom: HTMLElement) => {
  const b = dom.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - b.left) / b.width) * 2 - 1,
    -(((e.clientY - b.top) / b.height) * 2 - 1),
  );
};

/** Dispose every geometry and material under an object. */
export const disposeDeep = (o: THREE.Object3D) =>
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
    else mat?.dispose();
  });
