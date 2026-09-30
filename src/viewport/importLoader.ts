import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { getModelBytes } from "../state/modelStore";
import { ImportEntry } from "../types";
import { std } from "./helpers";

/**
 * Recenter on its own bounding box, and rescale so wildly different source
 * units (e.g. glTF meters vs. this scene's millimetres) land in a sane,
 * visible size range by default.
 */
const fitImport = (holder: THREE.Group, obj: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(obj);
  if (!box.isEmpty()) {
    const c = box.getCenter(new THREE.Vector3());
    obj.position.sub(c);
    const size = box.getSize(new THREE.Vector3()),
      maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0 && (maxDim > 220 || maxDim < 8)) {
      const s = 80 / maxDim;
      obj.scale.multiplyScalar(s);
    }
  }
  holder.add(obj);
};

/**
 * Parse an imported model's bytes into a holder group. `onLoaded` fires once
 * the holder is ready (async for glTF, sync otherwise).
 */
export const loadImport = (
  entry: ImportEntry,
  onLoaded: (holder: THREE.Group) => void,
) => {
  const bytes = getModelBytes(entry.id);
  if (!bytes) return;
  const holder = new THREE.Group();
  try {
    if (entry.format === "glb" || entry.format === "gltf") {
      new GLTFLoader().parse(
        bytes,
        "",
        (gltf) => {
          fitImport(holder, gltf.scene);
          onLoaded(holder);
        },
        () => {},
      );
    } else if (entry.format === "obj") {
      const obj = new OBJLoader().parse(new TextDecoder().decode(bytes));
      fitImport(holder, obj);
      onLoaded(holder);
    } else {
      const geo = new STLLoader().parse(bytes);
      fitImport(holder, new THREE.Mesh(geo, std(0x9a86ff)));
      onLoaded(holder);
    }
  } catch {
    // Bad/unsupported file: it simply won't appear. Left for the person
    // to notice and re-export; no in-UI error surface yet.
  }
};
