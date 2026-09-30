import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Geo, SceneObject } from "../types";
import { buildShape } from "../utils/profile";

/** Signature of a geometry spec; vertex edits are only valid for this exact spec. */
export const geoSig = (geo: Geo) => JSON.stringify(geo);

/** Changes whenever the object's mesh must be rebuilt. */
export const meshKey = (o: SceneObject) =>
  geoSig(o.geo) + "#" + (o.edits?.id ?? "");

/** Generate the object's geometry in its local three.js space (Y up). */
function baseGeometry(geo: Exclude<Geo, { kind: "import" }>): THREE.BufferGeometry {
  switch (geo.kind) {
    case "extrude": {
      if (geo.pts.length < 3) return new THREE.BufferGeometry();
      const g = new THREE.ExtrudeGeometry(buildShape(geo.pts), {
        depth: geo.depth,
        bevelEnabled: geo.bevel > 0,
        bevelSize: geo.bevel,
        bevelThickness: geo.bevel,
        bevelSegments: Math.max(1, geo.seg >> 2),
        curveSegments: geo.seg,
      });
      // Sketch plane lies on the ground (sketch Y → Figma Y), extruded upward.
      g.rotateX(-Math.PI / 2);
      return g;
    }
    case "box": {
      const [w, h, d] = geo.size;
      if (!geo.copies) return new THREE.BoxGeometry(w, h, d);
      return mergeGeometries(
        geo.copies.map(([x, y, z]) =>
          new THREE.BoxGeometry(w, h, d).translate(x, y, z),
        ),
      );
    }
    case "sphere":
      return new THREE.SphereGeometry(20, 24, 16);
    case "cylinder":
      return new THREE.CylinderGeometry(18, 18, 44, 24);
    case "cone":
      return new THREE.ConeGeometry(20, 40, 24);
  }
}

/** Geometry for a (non-import) object, with its vertex edits applied. */
export function buildGeometry(o: SceneObject): THREE.BufferGeometry {
  if (o.geo.kind === "import") return new THREE.BufferGeometry();
  const g = baseGeometry(o.geo);
  const pos = g.attributes.position as THREE.BufferAttribute | undefined;
  if (
    pos &&
    o.edits &&
    o.edits.sig === geoSig(o.geo) &&
    o.edits.pos.length === pos.array.length
  ) {
    (pos.array as Float32Array).set(o.edits.pos);
    pos.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
  }
  return g;
}
