import * as THREE from "three";
import { SceneObject } from "../types";
import { buildGeometry, meshKey } from "./geometry";
import { disposeDeep, std } from "./helpers";
import { loadImport } from "./importLoader";
import { applyXf } from "./transforms";

type Entry = {
  holder: THREE.Group;
  /** Generated mesh (undefined for imported models) */
  mesh?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  key: string;
  ghost: boolean;
};

export type SyncOptions = {
  /** Don't write the stored transform onto this object (it's being dragged). */
  skipXform?: string | null;
  /** Fade every object except this one (Edit Vertices context). */
  ghostExcept?: string | null;
};

const GHOST_OPACITY = 0.18;

const setGhost = (holder: THREE.Object3D, ghost: boolean) =>
  holder.traverse((c) => {
    const mats = (c as THREE.Mesh).material;
    if (!mats) return;
    for (const m of Array.isArray(mats) ? mats : [mats]) {
      if (ghost) {
        m.userData.orig ??= {
          transparent: m.transparent,
          opacity: m.opacity,
          depthWrite: m.depthWrite,
        };
        m.transparent = true;
        m.opacity = GHOST_OPACITY;
        m.depthWrite = false;
      } else if (m.userData.orig) {
        Object.assign(m, m.userData.orig);
        delete m.userData.orig;
      }
      m.needsUpdate = true;
    }
  });

/**
 * Keeps three.js objects in step with the document's object list: creates,
 * rebuilds (when geometry or vertex edits change), recolors, transforms and
 * removes them. Shared by the Model 3D, Camera and Edit Vertices screens.
 */
export function createObjectSync(scene: THREE.Scene) {
  const entries = new Map<string, Entry>();
  const importAttempted = new Set<string>();
  let liveIds = new Set<string>();

  const remove = (id: string) => {
    const e = entries.get(id);
    if (!e) return;
    scene.remove(e.holder);
    disposeDeep(e.holder);
    entries.delete(id);
  };

  const update = (objects: SceneObject[], opts: SyncOptions = {}) => {
    liveIds = new Set(objects.map((o) => o.id));
    for (const id of [...entries.keys()]) if (!liveIds.has(id)) remove(id);
    for (const id of [...importAttempted])
      if (!liveIds.has(id)) importAttempted.delete(id);

    for (const o of objects) {
      let e = entries.get(o.id);
      if (o.geo.kind === "import") {
        if (!e && !importAttempted.has(o.id)) {
          importAttempted.add(o.id);
          loadImport({ id: o.id, name: o.name, format: o.geo.format }, (holder) => {
            // Deleted while it was loading? Then don't add it.
            if (!liveIds.has(o.id) || entries.has(o.id)) return disposeDeep(holder);
            entries.set(o.id, { holder, key: "", ghost: false });
            scene.add(holder);
          });
        }
      } else if (!e) {
        const holder = new THREE.Group();
        const mesh = new THREE.Mesh(buildGeometry(o), std(o.color));
        holder.add(mesh);
        scene.add(holder);
        e = { holder, mesh, key: meshKey(o), ghost: false };
        entries.set(o.id, e);
      } else if (e.mesh) {
        const k = meshKey(o);
        if (k !== e.key) {
          e.key = k;
          e.mesh.geometry.dispose();
          e.mesh.geometry = buildGeometry(o);
        }
        e.mesh.material.color.set(o.color);
      }

      e = entries.get(o.id);
      if (!e) continue;
      if (opts.skipXform !== o.id) applyXf(e.holder, o.xform);
      const ghost =
        opts.ghostExcept !== undefined && opts.ghostExcept !== o.id;
      if (ghost !== e.ghost) {
        e.ghost = ghost;
        setGhost(e.holder, ghost);
      }
    }
  };

  return {
    update,
    getHolder: (id: string | null) => (id ? entries.get(id)?.holder : undefined),
    getMesh: (id: string | null) => (id ? entries.get(id)?.mesh : undefined),
    /** Every pickable mesh with the object id it belongs to. */
    pickables: () => {
      const out: { obj: THREE.Object3D; id: string }[] = [];
      for (const [id, e] of entries)
        e.holder.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && !c.userData.overlay)
            out.push({ obj: c, id });
        });
      return out;
    },
    dispose: () => {
      for (const id of [...entries.keys()]) remove(id);
    },
  };
}

export type ObjectSync = ReturnType<typeof createObjectSync>;
