import * as THREE from "three";
import { findObject, isEditableMesh } from "../../utils/objects";
import { geoSig } from "../geometry";
import { CURVE } from "../helpers";
import { createObjectSync } from "../objectSync";
import {
  figmaDeltaToThree,
  threeDeltaToFigma,
  threeToFigma,
} from "../transforms";
import { ModeHandle, SceneContext } from "./types";

/**
 * Edit Vertices: edits the mesh of the object selected in the document; the
 * rest of the chair is shown faded for context. The pending move (+ soft
 * selection) is previewed live and saved to the object on Apply.
 */
export function setupVertexScene(ctx: SceneContext): ModeHandle {
  const { scene: sc, dom, orbit, persp, params, cb, isDragging } = ctx;
  const sync = createObjectSync(sc);
  orbit.target.set(0, 60, 0);

  const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    }),
    ptsMat = new THREE.PointsMaterial({
      size: 4,
      sizeAttenuation: false,
      color: 0x9a86ff,
    }),
    selMat = new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: false,
      color: 0xfbbf24,
      depthTest: false,
    }),
    selG = new THREE.BufferGeometry();

  // The gizmo drives an invisible dummy placed at the selection centroid.
  const dummy = new THREE.Object3D(),
    cen = new THREE.Vector3(); // selection centroid, world space
  sc.add(dummy);
  const tc = ctx.createGizmo(dummy, () => {
    const d = dummy.position.clone().sub(cen);
    cb().ui({ move: threeDeltaToFigma(d) });
  });

  // --- Current edit target -------------------------------------------------
  let editId: string | null = null,
    editKey = "",
    mesh: THREE.Mesh | undefined,
    pos: THREE.BufferAttribute | undefined,
    /** Positions before the pending move (local space) */
    base = new Float32Array(),
    /** up[u] = first buffer index of unique vertex u; vu[i] = unique id of index i */
    up: number[] = [],
    vu: number[] = [],
    sel: number[] = [],
    overlays: THREE.Object3D[] = [],
    previewKey = "",
    lastCmd = params().ui.cmd.n,
    reportedEmpty = false;

  const at = (i: number) =>
      new THREE.Vector3(base[3 * i], base[3 * i + 1], base[3 * i + 2]),
    cur = (u: number) => new THREE.Vector3().fromBufferAttribute(pos!, up[u]);

  const teardown = () => {
    overlays.forEach((o) => o.parent?.remove(o));
    overlays = [];
    mesh = pos = undefined;
  };

  const setup = (m: THREE.Mesh, keepSel: boolean) => {
    teardown();
    mesh = m;
    pos = m.geometry.attributes.position as THREE.BufferAttribute;
    base = Float32Array.from(pos.array as Float32Array);
    // Geometries duplicate vertices per face; weld them by position.
    const ids = new Map<string, number>();
    const prevCount = up.length;
    up = [];
    vu = [];
    for (let i = 0; i < pos.count; i++) {
      const k = [0, 1, 2].map((a) => base[3 * i + a].toFixed(2)).join();
      if (!ids.has(k)) {
        ids.set(k, up.length);
        up.push(i);
      }
      vu.push(ids.get(k)!);
    }
    if (!keepSel || up.length !== prevCount) sel = [];
    overlays = [
      new THREE.Mesh(m.geometry, wireMat),
      new THREE.Points(m.geometry, ptsMat),
      new THREE.Points(selG, selMat),
    ];
    overlays.forEach((o) => {
      o.userData.overlay = true;
      o.frustumCulled = false;
    });
    m.add(...overlays);
    previewKey = "";
  };

  /** Point the camera at the object being edited. */
  const frame = (holder: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(holder);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3()),
      size = box.getSize(new THREE.Vector3()).length();
    orbit.target.copy(c);
    persp.position
      .copy(c)
      .add(new THREE.Vector3(1, 0.8, 1.15).normalize().multiplyScalar(size * 1.4 + 80));
  };

  const update = () => {
    const { objects, ui } = params();
    const found = findObject(objects, ui.selected);
    const o = found && isEditableMesh(found) ? found : undefined;
    sync.update(objects, { ghostExcept: o ? o.id : undefined });
    const m = o ? sync.getMesh(o.id) : undefined;

    if (!o || !m) {
      if (editId !== null) teardown();
      editId = null;
      editKey = "";
      tc.enabled = false;
      tc.getHelper().visible = false;
      if (!reportedEmpty) cb().verts([], 0, 0);
      reportedEmpty = true;
      return;
    }
    reportedEmpty = false;

    // (Re)build when the object changes, or its geometry / saved edits do.
    const k = o.id + "|" + geoSig(o.geo) + "|" + (o.edits?.id ?? "");
    if (k !== editKey || mesh !== m) {
      editKey = k;
      setup(m, editId === o.id);
      if (editId !== o.id) frame(sync.getHolder(o.id)!);
      editId = o.id;
    }

    // Apply / Reset: save the previewed positions, or drop the pending move
    if (ui.cmd.n !== lastCmd) {
      lastCmd = ui.cmd.n;
      const moved = ui.move.some((c) => c !== 0) && sel.length > 0;
      if (ui.cmd.k === "apply" && moved)
        cb().setEdits(
          o.id,
          Float32Array.from(pos!.array as Float32Array),
          geoSig(o.geo),
          sel.length,
        );
      cb().ui({ move: [0, 0, 0] });
      return;
    }

    m.updateWorldMatrix(true, false);
    const mw = m.matrixWorld;
    const pk = JSON.stringify([ui.move, ui.falloff, ui.curve, sel, mw.elements]);
    if (pk === previewKey) return;
    previewKey = pk;

    // Soft selection is measured in world space (mm), applied in local space.
    const world = (i: number) => at(i).applyMatrix4(mw);
    cen.set(0, 0, 0);
    sel.forEach((u) => cen.add(world(up[u])));
    cen.divideScalar(sel.length || 1);
    const mvW = sel.length ? figmaDeltaToThree(ui.move) : new THREE.Vector3(),
      inv = mw.clone().invert(),
      mvL = cen
        .clone()
        .add(mvW)
        .applyMatrix4(inv)
        .sub(cen.clone().applyMatrix4(inv)),
      S = new Set(sel),
      affected = new Set<number>();
    for (let i = 0; i < pos!.count; i++) {
      const s = S.has(vu[i]),
        w = s
          ? 1
          : sel.length
            ? CURVE[ui.curve](
                Math.max(0, 1 - world(i).distanceTo(cen) / ui.falloff),
              )
            : 0;
      if (w > 0 && !s) affected.add(vu[i]);
      pos!.setXYZ(
        i,
        base[3 * i] + mvL.x * w,
        base[3 * i + 1] + mvL.y * w,
        base[3 * i + 2] + mvL.z * w,
      );
    }
    pos!.needsUpdate = true;
    m.geometry.computeVertexNormals();
    m.geometry.computeBoundingSphere();
    selG.setFromPoints(sel.map(cur));
    tc.enabled = sel.length > 0;
    tc.getHelper().visible = sel.length > 0;
    if (!isDragging()) dummy.position.copy(cen).add(mvW);
    cb().verts(
      sel.map((u) => ({ id: u, p: threeToFigma(cur(u).applyMatrix4(mw)) })),
      affected.size,
      up.length,
    );
  };

  // Click picks the nearest vertex on screen (within 14px); Shift toggles.
  let dn: [number, number] | null = null;
  dom.onpointerdown = (e) => {
    dn = [e.clientX, e.clientY];
  };
  dom.onpointerup = (e) => {
    const d = dn;
    dn = null;
    if (
      !mesh ||
      !d ||
      tc.axis ||
      Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 4
    )
      return;
    const b = dom.getBoundingClientRect(),
      mw = mesh.matrixWorld;
    let best = -1,
      bd = 14;
    up.forEach((_, u) => {
      const s = cur(u).applyMatrix4(mw).project(persp);
      if (s.z > 1) return; // behind the camera
      const dd = Math.hypot(
        ((s.x + 1) / 2) * b.width - (e.clientX - b.left),
        ((1 - s.y) / 2) * b.height - (e.clientY - b.top),
      );
      if (dd < bd) {
        bd = dd;
        best = u;
      }
    });
    if (best >= 0)
      sel = e.shiftKey
        ? sel.includes(best)
          ? sel.filter((s) => s !== best)
          : [...sel, best]
        : [best];
    else if (!e.shiftKey) sel = [];
    // Changing the selection bakes nothing: the pending move is dropped.
    previewKey = "";
    cb().ui({ move: [0, 0, 0] });
  };

  return {
    update,
    dispose: () => {
      teardown();
      sync.dispose();
      [wireMat, ptsMat, selMat].forEach((m) => m.dispose());
      selG.dispose();
    },
  };
}
