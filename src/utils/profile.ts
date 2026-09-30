import * as THREE from "three";
import { Pt } from "../types";

/**
 * Closed outline through the sketch points. A "bezier" point is the control
 * point of a quadratic curve from the previous point to the next one.
 */
export function buildShape(pts: Pt[]): THREE.Shape {
  const shape = new THREE.Shape();
  const n = pts.length;
  if (n === 0) return shape;
  // Start on a corner so every curve has a real start point.
  const start = Math.max(
    0,
    pts.findIndex((p) => p.t === "corner"),
  );
  const r = [...pts.slice(start), ...pts.slice(0, start)];
  const allBezier = r[0].t === "bezier";
  shape.moveTo(r[0].x, r[0].y);
  let i = 1;
  while (i < n) {
    const p = r[i];
    if (p.t === "bezier" && !allBezier) {
      const end = r[(i + 1) % n]; // i + 1 === n curves back to the start
      shape.quadraticCurveTo(p.x, p.y, end.x, end.y);
      i += 2;
    } else {
      shape.lineTo(p.x, p.y);
      i++;
    }
  }
  return shape;
}

/** Points along the closed outline (curves sampled), for drawing/measuring. */
export function sampleOutline(pts: Pt[], divisions = 12) {
  if (pts.length < 2) return pts.map((p) => ({ x: p.x, y: p.y }));
  return buildShape(pts)
    .getPoints(divisions)
    .map((v) => ({ x: v.x, y: v.y }));
}
