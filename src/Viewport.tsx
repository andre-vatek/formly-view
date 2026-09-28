import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export type Params = {
  depth: number;
  bevel: number;
  seg: number;
  color: string;
  fov: number;
  moveZ: number;
  falloff: number;
};
type View = { cam: THREE.Camera; r: [number, number, number, number] };
const PTS: [number, number][] = [
  [0, 0],
  [240, 0],
  [240, 112.5],
  [150, 202.5],
  [50, 202.5],
  [0, 152.5],
];
const ortho = (s: number) => {
  const c = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
  c.userData.s = s;
  return c;
};
const std = (c: number | string) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.1 });

export default function Viewport({ mode, p }: { mode: string; p: Params }) {
  const box = useRef<HTMLDivElement>(null),
    pr = useRef(p);
  pr.current = p;
  useEffect(() => {
    const el = box.current!,
      r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(devicePixelRatio);
    r.setScissorTest(true);
    el.appendChild(r.domElement);
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
      oc = new OrbitControls(main, r.domElement);
    let views: View[] = [{ cam: main, r: [0, 0, 1, 1] }],
      upd = () => {},
      key = "";
    if (mode === "05" || mode === "08") {
      const mat = std(pr.current.color),
        seat = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      seat.rotation.x = -Math.PI / 2;
      seat.position.y = 50;
      const shape = new THREE.Shape();
      [
        [-60, -50],
        [60, -50],
        [60, 40],
        [30, 50],
        [-30, 50],
        [-60, 30],
      ].forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
      const part = (
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
        c: number,
      ) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(c));
        m.position.set(x, y, z);
        return m;
      };
      const back = part(120, 110, 10, 0, 0, -55, 0x1fb5cc);
      sc.add(
        seat,
        back,
        ...[
          [-48, -38],
          [48, -38],
          [-48, 38],
          [48, 38],
        ].map(([x, z]) => part(12, 50, 12, x, 25, z, 0x2b2542)),
      );
      upd = () => {
        const q = pr.current,
          k = [q.depth, q.bevel, q.seg].join();
        if (k !== key) {
          key = k;
          seat.geometry.dispose();
          seat.geometry = new THREE.ExtrudeGeometry(shape, {
            depth: q.depth,
            bevelEnabled: q.bevel > 0,
            bevelSize: q.bevel,
            bevelThickness: q.bevel,
            bevelSegments: Math.max(1, q.seg >> 2),
            curveSegments: q.seg,
          });
        }
        mat.color.set(q.color);
        back.position.y = 50 + q.depth + 55;
      };
      if (mode === "08") {
        const t = ortho(180),
          f = ortho(180),
          s = ortho(180);
        t.position.set(0, 500, 0);
        t.up.set(0, 0, -1);
        t.lookAt(0, 0, 0);
        f.position.set(0, 110, 500);
        f.lookAt(0, 110, 0);
        s.position.set(500, 110, 0);
        s.lookAt(0, 110, 0);
        views = [
          { cam: t, r: [0, 0, 0.5, 0.5] },
          { cam: persp, r: [0.5, 0, 0.5, 0.5] },
          { cam: f, r: [0, 0.5, 0.5, 0.5] },
          { cam: s, r: [0.5, 0.5, 0.5, 0.5] },
        ];
      }
    }
    if (mode === "06") {
      grid.rotation.x = Math.PI / 2;
      oc.enableRotate = false;
      oc.target.set(120, 100, 0);
      const v = PTS.map(([x, y]) => new THREE.Vector3(x, y, 0)),
        g = new THREE.BufferGeometry().setFromPoints(v);
      sc.add(
        new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: 0xa48bff })),
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            size: 8,
            sizeAttenuation: false,
            color: 0xffffff,
          }),
        ),
      );
      [
        [80, 60],
        [160, 60],
      ].forEach(([x, y]) => {
        const c = new THREE.Mesh(
          new THREE.RingGeometry(7, 9, 32),
          new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
        );
        c.position.set(x, y, 0);
        sc.add(c);
      });
    }
    if (mode === "07") {
      persp.position.set(220, 170, 260);
      oc.target.set(0, 0, 0);
      const g = new THREE.BoxGeometry(200, 40, 140, 10, 1, 8),
        pos = g.attributes.position as THREE.BufferAttribute,
        base = Float32Array.from(pos.array as Float32Array);
      const at = (i: number) =>
          new THREE.Vector3(base[3 * i], base[3 * i + 1], base[3 * i + 2]),
        tgt = new THREE.Vector3(0, 20, 40);
      const top = [...Array(pos.count).keys()]
        .filter((i) => base[3 * i + 1] > 19)
        .sort((a, b) => at(a).distanceTo(tgt) - at(b).distanceTo(tgt));
      const S: THREE.Vector3[] = [];
      top.forEach((i) => {
        const v = at(i);
        if (S.length < 3 && !S.some((s) => s.distanceTo(v) < 0.01)) S.push(v);
      });
      const cen = S.reduce(
          (a, v) => a.add(v),
          new THREE.Vector3(),
        ).divideScalar(3),
        sel = new THREE.BufferGeometry();
      sc.add(
        new THREE.Mesh(
          g,
          new THREE.MeshStandardMaterial({
            color: 0x6a49f0,
            flatShading: true,
          }),
        ),
        new THREE.Mesh(
          g,
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.18,
          }),
        ),
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            size: 4,
            sizeAttenuation: false,
            color: 0x9a86ff,
          }),
        ),
        new THREE.Points(
          sel,
          new THREE.PointsMaterial({
            size: 10,
            sizeAttenuation: false,
            color: 0xfbbf24,
          }),
        ),
      );
      upd = () => {
        const q = pr.current,
          k = q.moveZ + "," + q.falloff;
        if (k === key) return;
        key = k;
        for (let i = 0; i < pos.count; i++) {
          const v = at(i),
            d = v.distanceTo(cen),
            w = S.some((s) => s.distanceTo(v) < 0.01)
              ? 1
              : Math.max(0, 1 - d / q.falloff),
            sm = w * w * (3 - 2 * w);
          pos.setY(i, v.y + q.moveZ * sm);
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
        sel.setFromPoints(S.map((s) => s.clone().setY(s.y + q.moveZ)));
      };
    }
    let W = 1,
      H = 1;
    const fit = (c: THREE.Camera, a: number) => {
      if (c instanceof THREE.PerspectiveCamera) {
        c.aspect = a;
        c.fov = pr.current.fov;
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
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      upd();
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
      oc.dispose();
      r.dispose();
      el.removeChild(r.domElement);
    };
  }, [mode]);
  const Q = (t: string, s: React.CSSProperties) => (
    <span className="ql" style={s}>
      {t}
    </span>
  );
  return (
    <>
      <div ref={box} style={{ position: "absolute", inset: 0 }} />
      {mode === "08" && (
        <>
          {Q("Top · Ortho", { left: 8, top: 8 })}
          {Q("Perspective · FOV " + p.fov + "°", {
            left: "calc(50% + 8px)",
            top: 8,
          })}
          {Q("Front · Ortho", { left: 8, top: "calc(50% + 8px)" })}
          {Q("Right · Ortho", {
            left: "calc(50% + 8px)",
            top: "calc(50% + 8px)",
          })}
          <i
            className="xl"
            style={{ left: "50%", top: 0, bottom: 0, width: 1 }}
          />
          <i
            className="xl"
            style={{ top: "50%", left: 0, right: 0, height: 1 }}
          />
        </>
      )}
    </>
  );
}
