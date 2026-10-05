import * as THREE from "three";
import { Pt } from "../../types";
import { sketchTarget } from "../../utils/objects";
import { sampleOutline } from "../../utils/profile";
import { toNdc } from "../helpers";
import { ModeHandle, SceneContext } from "./types";

const snap = (n: number) => Math.round(n / 10) * 10;

/**
 * Sketch 2D: top-down ortho canvas editing the outline of the selected
 * extrusion (live), or a new draft outline when no extrusion is selected.
 */
export function setupSketchScene(ctx: SceneContext): ModeHandle {
  const { scene: sc, dom, grid, orbit, flat, params, cb } = ctx;

  // Flat, pan/zoom-only view of the sketch plane
  grid.rotation.x = Math.PI / 2;
  orbit.enableRotate = false;
  orbit.mouseButtons = {
    LEFT: null,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };

  const current = () => {
    const { objects, ui } = params();
    const target = sketchTarget(objects, ui.selected);
    return { target, pts: target ? target.geo.pts : ui.draft, active: ui.active };
  };

  // Outline (closed, curves sampled), control polygon, and point handles
  const og = new THREE.BufferGeometry(),
    cg = new THREE.BufferGeometry(),
    pg = new THREE.BufferGeometry(),
    outline = new THREE.LineLoop(
      og,
      new THREE.LineBasicMaterial({ color: 0xa48bff }),
    ),
    control = new THREE.Line(
      cg,
      new THREE.LineBasicMaterial({
        color: 0x5a5f72,
        transparent: true,
        opacity: 0.6,
      }),
    ),
    dots = new THREE.Points(
      pg,
      new THREE.PointsMaterial({
        size: 10,
        sizeAttenuation: false,
        vertexColors: true,
      }),
    );
  outline.frustumCulled = control.frustumCulled = dots.frustumCulled = false;
  sc.add(outline, control, dots);

  /** Center the view on the outline whenever the sketch target changes. */
  const frame = (pts: Pt[]) => {
    let cx = 0,
      cy = 0,
      s = 160;
    if (pts.length) {
      const xs = pts.map((p) => p.x),
        ys = pts.map((p) => p.y);
      const [x0, x1, y0, y1] = [
        Math.min(...xs),
        Math.max(...xs),
        Math.min(...ys),
        Math.max(...ys),
      ];
      cx = (x0 + x1) / 2;
      cy = (y0 + y1) / 2;
      s = Math.max(80, Math.max(x1 - x0, y1 - y0) * 0.75);
    }
    orbit.target.set(cx, cy, 0);
    flat.position.set(cx, cy, 500);
    flat.userData.s = s;
    flat.zoom = 1;
  };

  let key = "",
    framed: string | null = null;
  const update = () => {
    const { target, pts, active } = current();
    const tid = target?.id ?? "draft";
    if (tid !== framed) {
      framed = tid;
      frame(pts);
    }
    const k = JSON.stringify([tid, pts, active]);
    if (k === key) return;
    key = k;
    const v = pts.map((t) => new THREE.Vector3(t.x, t.y, 0));
    cg.setFromPoints(v);
    pg.setFromPoints(v);
    og.setFromPoints(
      pts.length >= 3
        ? sampleOutline(pts).map((p) => new THREE.Vector3(p.x, p.y, 0))
        : [],
    );
    // Active point amber, bezier control points cyan, corners white
    pg.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        pts.flatMap((t, i) =>
          i === active
            ? [0.98, 0.75, 0.14]
            : t.t === "bezier"
              ? [0.13, 0.83, 0.93]
              : [1, 1, 1],
        ),
        3,
      ),
    );
  };

  /** Pointer position on the sketch plane (z = 0). */
  const world = (e: PointerEvent) => {
    const rc = new THREE.Raycaster(),
      v = new THREE.Vector3();
    rc.setFromCamera(toNdc(e, dom), flat);
    rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), v);
    return v;
  };

  let di = -1; // index of the point being dragged
  dom.onpointerdown = (e) => {
    if (e.button !== 0) return;
    cb().gesture(true); // press → release is one undo step
    const w = world(e),
      { pts, active } = current(),
      // 12px hit radius converted to world units
      th = 12 / ((dom.clientHeight / (2 * flat.userData.s)) * flat.zoom);
    let i = pts.findIndex((t) => Math.hypot(t.x - w.x, t.y - w.y) < th);
    if (i < 0) {
      // New point goes right after the active one
      i = pts.length ? Math.min(active, pts.length - 1) + 1 : 0;
      const np: Pt[] = [
        ...pts.slice(0, i),
        { x: snap(w.x), y: snap(w.y), t: "corner" },
        ...pts.slice(i),
      ];
      cb().sketch(np, i);
    } else cb().sketch(pts, i);
    di = i;
    dom.setPointerCapture(e.pointerId);
  };
  dom.onpointermove = (e) => {
    if (di < 0) return;
    const w = world(e),
      { pts } = current();
    const x = snap(w.x),
      y = snap(w.y);
    if (pts[di] && (pts[di].x !== x || pts[di].y !== y))
      cb().sketch(
        pts.map((t, j) => (j === di ? { ...t, x, y } : t)),
        di,
      );
  };
  dom.onpointerup = dom.onpointercancel = () => {
    if (di < 0) return;
    di = -1;
    cb().gesture(false);
  };

  return { update };
}
