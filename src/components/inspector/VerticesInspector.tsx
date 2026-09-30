import { EditorState } from "../../state/useEditorState";
import { Curve, XYZ } from "../../types";
import { isEditableMesh } from "../../utils/objects";
import PanelHeader from "../ui/PanelHeader";
import Slider from "../ui/Slider";
import Vec3Field from "../ui/Vec3Field";

const CURVES: Curve[] = ["smooth", "linear", "sharp", "root"];

/** Edit Vertices screen: selection table, move offset, soft selection. */
export default function VerticesInspector({
  ui,
  stats,
  selectedObj: o,
  cb,
}: EditorState) {
  if (!o || !isEditableMesh(o))
    return (
      <>
        <PanelHeader
          title="No editable object"
          subtitle="Select a part in the Layers list"
        />
        <div className="sec">
          <div className="box" style={{ margin: 0, padding: 10, fontSize: 11 }}>
            {o
              ? `${o.name} ${o.locked ? "is locked — unlock it in the layers list" : "is an imported model and can't be vertex-edited"}.`
              : "Pick an object from the Layers list to edit its vertices."}
          </div>
        </div>
      </>
    );
  const sel = { v: stats.verts.v, n: stats.verts.affected };
  const moved = ui.move.some((c) => c !== 0);
  const avg = sel.v.length
    ? ([0, 1, 2].map(
        (a) =>
          +(sel.v.reduce((s, x) => s + x.p[a], 0) / sel.v.length).toFixed(1),
      ) as XYZ)
    : null;

  return (
    <>
      <PanelHeader
        title={`${sel.v.length} vertices`}
        subtitle={`${o.name} · ${stats.verts.total} verts · live soft selection`}
      />
      <div className="sec">
        <div className="lbl">Selected vertices</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>X</th>
              <th>Y</th>
              <th>Z</th>
            </tr>
          </thead>
          <tbody>
            {sel.v.map((x, i) => (
              <tr key={x.id} className={i === sel.v.length - 1 ? "on" : ""}>
                <td style={{ color: "var(--am)" }}>● #{x.id}</td>
                <td>{x.p[0]}</td>
                <td>{x.p[1]}</td>
                <td style={{ color: "var(--bl)" }}>{x.p[2]}</td>
              </tr>
            ))}
            {avg && (
              <tr>
                <td className="dim">avg</td>
                <td className="dim">{avg[0]}</td>
                <td className="dim">{avg[1]}</td>
                <td className="dim">{avg[2]}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="sec">
        <div className="lbl">Move by</div>
        <Vec3Field
          value={ui.move}
          disabled={!sel.v.length}
          onChange={(move) => cb.ui({ move })}
        />
      </div>
      <div className="sec">
        <div className="lbl">Soft selection</div>
        <Slider
          label="Falloff radius"
          value={ui.falloff}
          min={5}
          max={120}
          unit=" mm"
          onChange={(falloff) => cb.ui({ falloff })}
        />
        <div className="mute" style={{ marginBottom: 8 }}>
          Falloff curve
        </div>
        <div
          className="g3"
          style={{ gridTemplateColumns: "repeat(4,1fr)", margin: "0 0 14px" }}
        >
          {CURVES.map((c) => (
            <span
              key={c}
              className="btn"
              onClick={() => cb.ui({ curve: c })}
              style={{
                textAlign: "center",
                padding: "10px 0",
                fontSize: 10,
                textTransform: "capitalize",
                color: ui.curve === c ? "var(--am)" : "var(--dim)",
                borderColor: ui.curve === c ? "var(--am)" : undefined,
                background: ui.curve === c ? "rgba(251,191,36,.1)" : undefined,
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <div
          className="box"
          style={{ margin: "0 0 14px", padding: 10, fontSize: 11 }}
        >
          Affects {sel.n} neighbouring vertices
        </div>
        <div className="g2" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
          <button
            className="btn pri"
            style={{ padding: 10 }}
            disabled={!moved || !sel.v.length}
            onClick={() => cb.ui({ cmd: { n: ui.cmd.n + 1, k: "apply" } })}
          >
            Apply
          </button>
          <button
            className="btn"
            style={{ padding: 10 }}
            disabled={!moved}
            onClick={() => cb.ui({ cmd: { n: ui.cmd.n + 1, k: "reset" } })}
          >
            Reset
          </button>
        </div>
        <button
          className="btn blk"
          style={{ marginTop: 8, padding: 10 }}
          disabled={!o.edits}
          onClick={() => cb.clearEdits(o.id)}
        >
          {o.edits ? "Clear saved vertex edits" : "No saved vertex edits"}
        </button>
      </div>
    </>
  );
}
