import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { Cb, ScreenId, ViewParams } from "../../types";
import { View } from "../helpers";

/** Everything the shared Viewport shell hands to a mode's setup function. */
export type SceneContext = {
  mode: ScreenId;
  scene: THREE.Scene;
  dom: HTMLCanvasElement;
  grid: THREE.GridHelper;
  orbit: OrbitControls;
  persp: THREE.PerspectiveCamera;
  flat: THREE.OrthographicCamera;
  /** Latest objects + UI state (read every frame; never stale) */
  params: () => ViewParams;
  /** Latest callbacks */
  cb: () => Cb;
  /** True while the transform gizmo is being dragged */
  isDragging: () => boolean;
  /** Create the transform gizmo (on the perspective camera); the shell disposes it. */
  createGizmo: (
    target: THREE.Object3D | null,
    onChange: (obj: THREE.Object3D) => void,
  ) => TransformControls;
};

/** What a mode gives back to the shell. */
export type ModeHandle = {
  /** Called every frame before rendering; syncs the scene with params. */
  update: () => void;
  /** Viewports to render (defaults to the main camera, full size). */
  views?: View[];
  /** Extra cleanup (listeners etc.) on unmount. */
  dispose?: () => void;
};
