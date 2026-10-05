import { EditorState } from "../../state/useEditorState";
import { Pt, ScreenId } from "../../types";
import { sketchTarget } from "../../utils/objects";
import { area, perimeter } from "../../utils/polygon";
import { sampleOutline } from "../../utils/profile";
import PanelHeader from "../ui/PanelHeader";

type Props = EditorState & { go: (s: ScreenId) => void };

/**
 * Sketch 2D screen: edits the selected extrusion's outline live, or builds a
 * new draft outline that Extrude turns into a new object.
 */
export default function SketchInspector({ doc, ui, selectedObj, cb, go }: Props) {
  const target = sketchTarget(doc.objects, ui.selected);
  const pts = target ? target.geo.pts : ui.draft;
  const active = Math.min(ui.active, pts.length - 1);
  const minPts = target ? 3 : 0; // an extrusion must stay a closed shape
  const outline = pts.length >= 3 ? sampleOutline(pts) : [];

  const setPt = (i: number, d: Partial<Pt>) =>
    cb.sketch(
      pts.map((t, j) => (j === i ? { ...t, ...d } : t)),
      i,
    );

  /** Insert a point halfway between the active point and the next one. */
  const addPoint = () => {
    if (!pts.length) return cb.sketch([{ x: 0, y: 0, t: "corner" }], 0);
    const a = pts[active],
      b = pts[(active + 1) % pts.length];
    const snap = (n: number) => Math.round(n / 10) * 10;
    const np: Pt =
      pts.length === 1
        ? { x: a.x + 20, y: a.y, t: "corner" }
        : { x: snap((a.x + b.x) / 2), y: snap((a.y + b.y) / 2), t: "corner" };
    cb.sketch([...pts.slice(0, active + 1), np, ...pts.slice(active + 1)], active + 1);
  };

  const deleteActive = () =>
    pts.length > minPts &&
    cb.sketch(
      pts.filter((_, j) => j !== active),
      Math.max(0, active - 1),
    );

  const extrude = () => {
    cb.extrudeDraft();
    go("05");
  };

  return (
    <>
      <PanelHeader
        title={target ? `${target.name} outline` : "New outline"}
        subtitle={
          target
            ? `Closed path · ${pts.length} points · updates the 3D object live`
            : `Draft · ${pts.length} points · click the canvas to add points`
        }
      />
      {!target && selectedObj && (
        <div className="sec" style={{ paddingBottom: 0 }}>
          <div className="box" style={{ margin: 0, padding: 10, fontSize: 11 }}>
            {selectedObj.name} {selectedObj.locked ? "is locked" : "isn't an extrusion"}{" "}
            — drawing a new outline. Select an extrusion (e.g. Seat Base) to
            edit its outline.
          </div>
        </div>
      )}
      {target?.edits && (
        <div className="sec" style={{ paddingBottom: 0 }}>
          <div className="box" style={{ margin: 0, padding: 10, fontSize: 11 }}>
            Editing the outline discards {target.name}'s vertex edits (Undo
            brings them back).
          </div>
        </div>
      )}
      <div className="sec">
        <div className="lbl">Points</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>X</th>
              <th>Y</th>
              <th>TYPE</th>
            </tr>
          </thead>
          <tbody>
            {pts.map((t, i) => (
              <tr
                key={i}
                className={i === active ? "act" : ""}
                onClick={() => cb.ui({ active: i })}
              >
                <td className="mute">{i}</td>
                <td>
                  <input
                    className="cell"
                    type="number"
                    step={10}
                    value={t.x}
                    onChange={(e) => setPt(i, { x: +e.target.value })}
                    onFocus={() => cb.gesture(true)}
                    onBlur={() => cb.gesture(false)}
                    onKeyDown={(e) => e.key === "Enter" && cb.gesture(true)}
                  />
                </td>
                <td>
                  <input
                    className="cell"
                    type="number"
                    step={10}
                    value={t.y}
                    onChange={(e) => setPt(i, { y: +e.target.value })}
                    onFocus={() => cb.gesture(true)}
                    onBlur={() => cb.gesture(false)}
                    onKeyDown={(e) => e.key === "Enter" && cb.gesture(true)}
                  />
                </td>
                <td
                  style={{
                    color: t.t === "bezier" ? "var(--cy)" : undefined,
                    cursor: "pointer",
                  }}
                  title="Toggle corner / bezier"
                  onClick={() =>
                    setPt(i, { t: t.t === "bezier" ? "corner" : "bezier" })
                  }
                >
                  {t.t}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className="row"
          style={{
            marginTop: 10,
            gap: 14,
            color: "#a48bff",
            cursor: "pointer",
          }}
        >
          <span onClick={addPoint}>+ Add point</span>
          <span
            style={{
              color: pts.length > minPts ? "var(--rd)" : "var(--dim)",
              cursor: pts.length > minPts ? "pointer" : "default",
            }}
            title={pts.length > minPts ? undefined : "An extrusion needs at least 3 points"}
            onClick={deleteActive}
          >
            – Delete active
          </span>
        </div>
      </div>
      <div className="sec">
        <div className="lbl">Geometry</div>
        <div className="g2">
          <div className="box" style={{ margin: 0, padding: 10 }}>
            <span className="dim">Area</span>
            <div className="mono" style={{ marginTop: 6 }}>
              {Math.round(area(outline)).toLocaleString()} mm²
            </div>
          </div>
          <div className="box" style={{ margin: 0, padding: 10 }}>
            <span className="dim">Perimeter</span>
            <div className="mono" style={{ marginTop: 6 }}>
              {perimeter(outline).toFixed(1)} mm
            </div>
          </div>
        </div>
        {target ? (
          <div className="g2" style={{ marginTop: 18 }}>
            <button
              className="btn pri"
              style={{ padding: 12 }}
              onClick={() => go("05")}
            >
              View in 3D →
            </button>
            <button
              className="btn"
              style={{ padding: 12 }}
              onClick={() => cb.select(null)}
            >
              + New outline
            </button>
          </div>
        ) : (
          <>
            <button
              className="btn pri blk"
              style={{ marginTop: 18, padding: 12 }}
              disabled={pts.length < 3}
              title={pts.length < 3 ? "Add at least 3 points" : undefined}
              onClick={extrude}
            >
              Extrude →
            </button>
            {pts.length > 0 && (
              <button
                className="btn blk"
                style={{ marginTop: 8, padding: 10 }}
                onClick={() => cb.ui({ draft: [], active: 0 })}
              >
                Clear draft
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
