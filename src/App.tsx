import { useEffect, useState } from "react";
import Viewport, { Params } from "./Viewport";
type Id = "05" | "06" | "07" | "08";
const NAV: [string, Id | null, string][] = [
  ["Select", null, "M5 3l12 6-5 2-2 5z"],
  ["Pen", "06", "M14 4l6 6L9 21H3v-6z"],
  ["Extrude", "05", "M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4"],
  ["Vertices", "07", "M12 4l9 16H3z"],
  [
    "Camera",
    "08",
    "M20 12a8 8 0 01-14 5M4 12a8 8 0 0114-5M18 3v4h-4M6 21v-4h4",
  ],
];
const TABS: [string, Id][] = [
  ["Sketch 2D", "06"],
  ["Model 3D", "05"],
  ["Edit Vertices", "07"],
];
const M: Record<
  Id,
  {
    t: string;
    tab: number;
    l: [string, string][];
    h: string[];
    s: string[];
    hint: string;
  }
> = {
  "05": {
    t: "Chair Concept v3 · Saved",
    tab: 1,
    l: [
      ["#a48bff", "Seat Base"],
      ["#22d3ee", "Backrest"],
      ["#f472b6", "Legs"],
      ["#5a5f72", "Reference plane"],
    ],
    h: ["Extrude “Seat Base”", "Move vertex #12", "Draw polygon (6 pts)"],
    s: ["FPS 60", "Three.js r169"],
    hint: "Drag to orbit · wheel to zoom",
  },
  "06": {
    t: "Bike Light Mount · Editing",
    tab: 0,
    l: [
      ["#a48bff", "Mount outline"],
      ["#22d3ee", "Strap slot"],
      ["#f472b6", "Bolt holes"],
      ["#5a5f72", "Handlebar ref"],
    ],
    h: ["Add point #6", "Bezier node #4", "Start path"],
    s: ["Tool Pen", "Snap grid 10 mm"],
    hint: "6 points · Enter to finish · Esc to cancel",
  },
  "07": {
    t: "Bike Light Mount · Saved",
    tab: 2,
    l: [
      ["#a48bff", "Mount body"],
      ["#22d3ee", "Strap slot"],
      ["#fbbf24", "Light clip"],
      ["#5a5f72", "Handlebar ref"],
    ],
    h: ["Move 3 vertices", "Select #14–16", "Toggle soft selection"],
    s: ["Mode Vertex", "Selected 3 / 86"],
    hint: "Drag the sliders to move the selection",
  },
  "08": {
    t: "Chair Concept v3 · Saved",
    tab: 1,
    l: [
      ["#a48bff", "Seat Base"],
      ["#22d3ee", "Backrest"],
      ["#f472b6", "Legs"],
      ["#5a5f72", "Reference plane"],
    ],
    h: ["Camera moves are view state"],
    s: ["Camera Perspective", "Viewports 4"],
    hint: "Orbit in the Perspective view",
  },
};
const ID = (h: string): Id =>
  (["05", "06", "07", "08"].includes(h) ? h : "05") as Id;
const Sl = ({
  l,
  v,
  min,
  max,
  step = 1,
  u = "",
  on,
}: {
  l: string;
  v: number;
  min: number;
  max: number;
  step?: number;
  u?: string;
  on: (n: number) => void;
}) => (
  <div className="sl">
    <div className="row">
      <span className="mute">{l}</span>
      <span className="v">
        {v}
        {u}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={v}
      onChange={(e) => on(+e.target.value)}
    />
  </div>
);
const Head = ({ t, s }: { t: string; s: string }) => (
  <div className="pad row" style={{ gap: 10 }}>
    <span
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: "linear-gradient(#7c5cff,#452db3)",
      }}
    />
    <div className="grow">
      <div className="h">{t}</div>
      <div className="mute" style={{ fontSize: 11 }}>
        {s}
      </div>
    </div>
  </div>
);

export default function App() {
  const [id, setId] = useState<Id>(ID(location.hash.slice(1)));
  const [p, setP] = useState<Params>({
    depth: 40,
    bevel: 2.5,
    seg: 12,
    color: "#8b6cff",
    fov: 50,
    moveZ: 12.5,
    falloff: 36,
  });
  useEffect(() => {
    const f = () => setId(ID(location.hash.slice(1)));
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  const go = (k: Id) => {
      location.hash = k;
    },
    set = (k: keyof Params) => (n: number) => setP((o) => ({ ...o, [k]: n })),
    m = M[id];
  const right =
    id === "05" ? (
      <>
        <Head t="Seat Base" s="Extruded mesh · live" />
        <div className="sec">
          <div className="lbl">Extrude</div>
          <Sl
            l="Depth"
            v={p.depth}
            min={5}
            max={80}
            u=" mm"
            on={set("depth")}
          />
          <Sl
            l="Bevel size"
            v={p.bevel}
            min={0}
            max={8}
            step={0.5}
            u=" mm"
            on={set("bevel")}
          />
          <Sl l="Curve segments" v={p.seg} min={4} max={32} on={set("seg")} />
        </div>
        <div className="sec">
          <div className="lbl">Material</div>
          <div className="sws">
            {[
              "#8b6cff",
              "#4ad7f0",
              "#f472b6",
              "#fbbf24",
              "#a3e635",
              "#e8e9f0",
            ].map((c) => (
              <i
                key={c}
                className={"swc" + (p.color === c ? " on" : "")}
                style={{ background: c }}
                onClick={() => setP((o) => ({ ...o, color: c }))}
              />
            ))}
          </div>
        </div>
      </>
    ) : id === "06" ? (
      <>
        <Head t="Mount outline" s="Path2D · open · 6 points" />
        <div className="sec">
          <div className="lbl">Points</div>
          <table>
            <tbody>
              {[
                [0, 0],
                [240, 0],
                [240, 112.5],
                [150, 202.5],
                [50, 202.5],
                [0, 152.5],
              ].map(([x, y], i) => (
                <tr key={i}>
                  <td className="mute">{i}</td>
                  <td>{x.toFixed(1)}</td>
                  <td>{y.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="btn pri blk"
            style={{ marginTop: 18 }}
            onClick={() => go("05")}
          >
            Extrude →
          </button>
        </div>
      </>
    ) : id === "07" ? (
      <>
        <Head t="3 vertices" s="Mount body · live soft selection" />
        <div className="sec">
          <div className="lbl">Move by</div>
          <Sl
            l="Z"
            v={p.moveZ}
            min={-30}
            max={30}
            step={0.5}
            u=" mm"
            on={set("moveZ")}
          />
        </div>
        <div className="sec">
          <div className="lbl">Soft selection</div>
          <Sl
            l="Falloff radius"
            v={p.falloff}
            min={5}
            max={120}
            u=" mm"
            on={set("falloff")}
          />
        </div>
      </>
    ) : (
      <>
        <Head t="Perspective camera" s="Active viewport · top-right" />
        <div className="sec">
          <div className="lbl">Projection</div>
          <Sl
            l="Field of view"
            v={p.fov}
            min={20}
            max={100}
            u="°"
            on={set("fov")}
          />
        </div>
      </>
    );
  return (
    <div className="app">
      <header className="top">
        <span className="logo">F</span>
        <span className="menu">File Edit View Object Help</span>
        <span className="title">{m.t}</span>
        <div className="seg">
          {TABS.map(([t, k], i) => (
            <button
              key={k}
              className={m.tab === i ? "on" : ""}
              onClick={() => go(k)}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="btn">Share</button>
        <button className="btn pri">Export</button>
      </header>
      <nav className="tools">
        {NAV.map(([n, k, d]) => (
          <button
            key={n}
            title={n}
            className={k === id ? "on" : ""}
            onClick={() => k && go(k)}
          >
            <svg className="ic" viewBox="0 0 24 24">
              <path d={d} />
            </svg>
          </button>
        ))}
      </nav>
      <aside className="left">
        <div className="lhead">
          <span className="h">Layers</span>
        </div>
        {m.l.map(([c, n], i) => (
          <div key={n} className={"layer" + (i ? "" : " sel")}>
            <span className="sw" style={{ background: c }} />
            <span className="n">{n}</span>
          </div>
        ))}
        <div className="hist">
          <div className="lbl">History</div>
          {m.h.map((h, i) => (
            <div key={h} className={"hi" + (i ? "" : " on")}>
              {h}
            </div>
          ))}
        </div>
      </aside>
      <main className="view">
        <Viewport key={id} mode={id} p={p} />
        <div className="hint">{m.hint}</div>
      </main>
      <footer className="stat">
        {m.s.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </footer>
      <aside className="right">{right}</aside>
    </div>
  );
}
