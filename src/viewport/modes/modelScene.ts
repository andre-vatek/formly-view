import * as THREE from "three";
import { NO_LOCK } from "../../config/document";
import { findObject } from "../../utils/objects";
import { GIZMO_MODES, toNdc } from "../helpers";
import { createObjectSync } from "../objectSync";
import { FIGMA_TO_THREE_AXIS, readXf } from "../transforms";
import { ModeHandle, SceneContext } from "./types";

/**
 * The chair scene, shared by Model 3D (editable: gizmo + click-to-select) and
 * Camera (view-only).
 */
export function setupModelScene(ctx: SceneContext): ModeHandle {
  const { mode, scene: sc, dom, persp, params, cb, isDragging } = ctx;
  const editable = mode === "05";
  const sync = createObjectSync(sc);

  if (!editable)
    return {
      update: () => sync.update(params().objects),
      dispose: sync.dispose,
    };

  // --- Gizmo ---------------------------------------------------------------
  const tc = ctx.createGizmo(null, (obj) => {
    const id = params().ui.selected;
    if (id) cb().xf(id, readXf(obj));
  });

  const syncGizmo = () => {
    const { objects, ui } = params();
    const o = findObject(objects, ui.selected),
      holder = sync.getHolder(ui.selected);
    if (o && holder) {
      if (tc.object !== holder) tc.attach(holder);
      tc.enabled = !o.locked;
    } else {
      // Nothing selected, or its model is still loading.
      if (tc.object) tc.detach();
      tc.enabled = false;
    }
    tc.getHelper().visible = tc.enabled;
    // Per-axis locks: translate, rotate and scale are independently lockable.
    // showX/Y/Z both hides *and* disables dragging that axis's handle
    // (TransformControls filters its own raycast on handle.visible),
    // so this is a real interaction lock, not just a visual one.
    const lk = { ...NO_LOCK, ...o?.axisLocks };
    const active =
      tc.mode === "rotate" ? lk.rot : tc.mode === "scale" ? lk.scl : lk.pos;
    const show = [true, true, true];
    active.forEach((locked, i) => {
      if (locked) show[FIGMA_TO_THREE_AXIS[i]] = false;
    });
    tc.showX = show[0];
    tc.showY = show[1];
    tc.showZ = show[2];
  };

  const update = () => {
    const { objects, ui } = params();
    sync.update(objects, { skipXform: isDragging() ? ui.selected : null });
    syncGizmo();
  };

  const onKey = (e: KeyboardEvent) => {
    const m = GIZMO_MODES[e.key.toLowerCase()];
    if (m && !(e.target instanceof HTMLInputElement) && !e.metaKey && !e.ctrlKey)
      tc.setMode(m);
  };
  addEventListener("keydown", onKey);

  // A click (pointer moved < 4px, not on the gizmo) selects the object under
  // it, or clears the selection when clicking empty space.
  let dn: [number, number] | null = null;
  dom.onpointerdown = (e) => {
    dn = [e.clientX, e.clientY];
  };
  dom.onpointerup = (e) => {
    const d = dn;
    dn = null;
    if (!d || tc.axis || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 4)
      return;
    const rc = new THREE.Raycaster();
    rc.setFromCamera(toNdc(e, dom), persp);
    const pickables = sync.pickables();
    const hit = rc.intersectObjects(pickables.map((m) => m.obj))[0];
    cb().select(hit ? pickables.find((m) => m.obj === hit.object)!.id : null);
  };

  return {
    update,
    dispose: () => {
      removeEventListener("keydown", onKey);
      sync.dispose();
    },
  };
}
