import * as THREE from "three";
import { View, ortho } from "../helpers";

/** Four-up layout for the Camera screen: Top, Perspective, Front, Right. */
export function createQuadViews(persp: THREE.PerspectiveCamera): View[] {
  const top = ortho(180),
    front = ortho(180),
    side = ortho(180);
  top.position.set(0, 500, 0);
  top.up.set(0, 0, -1);
  top.lookAt(0, 0, 0);
  front.position.set(0, 110, 500);
  front.lookAt(0, 110, 0);
  side.position.set(500, 110, 0);
  side.lookAt(0, 110, 0);
  return [
    { cam: top, r: [0, 0, 0.5, 0.5] },
    { cam: persp, r: [0.5, 0, 0.5, 0.5] },
    { cam: front, r: [0, 0.5, 0.5, 0.5] },
    { cam: side, r: [0.5, 0.5, 0.5, 0.5] },
  ];
}
