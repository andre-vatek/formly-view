import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { Cb, ScreenId, ViewParams } from "../types";
import CameraOverlay from "./CameraOverlay";
import { View, ortho } from "./helpers";
import { createQuadViews } from "./modes/cameraViews";
import { setupModelScene } from "./modes/modelScene";
import { setupSketchScene } from "./modes/sketchScene";
import { ModeHandle, SceneContext } from "./modes/types";
import { setupVertexScene } from "./modes/vertexScene";

type Props = { mode: ScreenId; view: ViewParams; cb: Cb };

/**
 * three.js viewport shell: renderer, scene basics, cameras, orbit controls and
 * the render loop. The per-screen content lives in ./modes. The whole scene is
 * rebuilt when `mode` changes (App also remounts it with key={screen}).
 */
export default function Viewport({ mode, view, cb }: Props) {
  const box = useRef<HTMLDivElement>(null),
    pr = useRef(view),
    cbr = useRef(cb);
  pr.current = view;
  cbr.current = cb;

  useEffect(() => {
    const el = box.current!,
      r = new THREE.WebGLRenderer({ antialias: true, alpha: true }),
      dom = r.domElement;
    r.setPixelRatio(devicePixelRatio);
    r.setScissorTest(true);
    el.appendChild(dom);

    const sc = new THREE.Scene(),
      grid = new THREE.GridHelper(600, 30, 0x3a3f52, 0x1f2330);
    sc.add(grid, new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 1.6);
    dl.position.set(150, 300, 200);
    sc.add(dl);

    const persp = new THREE.PerspectiveCamera(50, 1, 1, 3000);
    persp.position.set(260, 200, 300);
    const flat = ortho(160);
    flat.position.set(120, 100, 500);
    const main = mode === "06" ? flat : persp,
      oc = new OrbitControls(main, dom);

    let drag = false,
      tc: TransformControls | null = null;
    // TransformControls.dispose() calls this.traverse, which doesn't exist on it (throws and unmounts the app), so dispose manually.
    const killTc = () => {
      if (!tc) return;
      tc.detach();
      tc.disconnect();
      tc.getHelper().traverse((c) => {
        const m = c as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose();
      });
    };

    const ctx: SceneContext = {
      mode,
      scene: sc,
      dom,
      grid,
      orbit: oc,
      persp,
      flat,
      params: () => pr.current,
      cb: () => cbr.current,
      isDragging: () => drag,
      createGizmo: (o, onChange) => {
        const t = new TransformControls(persp, dom);
        if (o) t.attach(o);
        sc.add(t.getHelper());
        t.addEventListener("dragging-changed", (e) => {
          drag = !!e.value;
          oc.enabled = !drag;
        });
        t.addEventListener("objectChange", () =>
          onChange(t.object as THREE.Object3D),
        );
        tc = t;
        return t;
      },
    };

    const handle: ModeHandle =
      mode === "06"
        ? setupSketchScene(ctx)
        : mode === "07"
          ? setupVertexScene(ctx)
          : setupModelScene(ctx);
    const views: View[] =
      handle.views ??
      (mode === "08"
        ? createQuadViews(persp)
        : [{ cam: main, r: [0, 0, 1, 1] }]);

    // --- Sizing & render loop ---------------------------------------------
    let W = 1,
      H = 1;
    const fit = (c: THREE.Camera, a: number) => {
      if (c instanceof THREE.PerspectiveCamera) {
        c.aspect = a;
        c.fov = pr.current.ui.fov;
      } else if (c instanceof THREE.OrthographicCamera) {
        const s = c.userData.s;
        c.left = -s * a;
        c.right = s * a;
        c.top = s;
        c.bottom = -s;
      }
      (c as THREE.PerspectiveCamera).updateProjectionMatrix();
    };
    const ro = new ResizeObserver(() => {
      W = el.clientWidth;
      H = el.clientHeight;
      r.setSize(W, H);
    });
    ro.observe(el);

    let raf = 0,
      frames = 0,
      fpsFrom = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      // Report FPS to the status bar about once a second
      frames++;
      const now = performance.now();
      if (now - fpsFrom >= 1000) {
        cbr.current.fps(Math.round((frames * 1000) / (now - fpsFrom)));
        frames = 0;
        fpsFrom = now;
      }
      handle.update();
      oc.update();
      for (const {
        cam,
        r: [x, y, w, h],
      } of views) {
        const vx = x * W,
          vy = H - (y + h) * H,
          vw = w * W,
          vh = h * H;
        r.setViewport(vx, vy, vw, vh);
        r.setScissor(vx, vy, vw, vh);
        fit(cam, vw / vh);
        r.render(sc, cam);
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      handle.dispose?.();
      killTc();
      oc.dispose();
      r.dispose();
      el.removeChild(dom);
    };
  }, [mode]);

  return (
    <>
      <div ref={box} style={{ position: "absolute", inset: 0 }} />
      {mode === "08" && <CameraOverlay fov={view.ui.fov} />}
    </>
  );
}
