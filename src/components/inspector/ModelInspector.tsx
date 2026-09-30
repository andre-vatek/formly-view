import { MATERIAL_SWATCHES, NO_LOCK } from "../../config/document";
import { EditorState } from "../../state/useEditorState";
import { ScreenId } from "../../types";
import AxisLockRow from "../ui/AxisLockRow";
import PanelHeader from "../ui/PanelHeader";
import Slider from "../ui/Slider";
import Vec3Field from "../ui/Vec3Field";

type Props = EditorState & { go: (s: ScreenId) => void };

/** Model 3D screen: transform, extrude settings, material of the selection. */
export default function ModelInspector({ selectedObj: o, cb, go }: Props) {
  if (!o)
    return (
      <PanelHeader
        title="Nothing selected"
        subtitle="Click a part in the viewport, or a layer, to select it"
      />
    );

  const locked = !!o.locked;
  const isImport = o.geo.kind === "import";
  const xf = o.xform;
  const axisLocks = { ...NO_LOCK, ...o.axisLocks };
  const geo = o.geo.kind === "extrude" ? o.geo : null;

  return (
    <>
      <PanelHeader
        title={o.name}
        subtitle={
          locked
            ? "Locked · click a layer or part to select"
            : "Click a part in the viewport, or a layer, to select it"
        }
      />
      <div className="sec">
        <div className="lbl">Transform</div>
        {locked && (
          <div
            className="box"
            style={{ margin: "0 0 12px", padding: 10, fontSize: 11 }}
          >
            This layer is locked. Unlock it in the layers list to edit it.
          </div>
        )}
        <Vec3Field
          label="Position"
          value={xf.pos}
          decimals={2}
          disabled={locked}
          onChange={(pos) => cb.xf(o.id, { ...xf, pos })}
        />
        {!locked && (
          <AxisLockRow
            locks={axisLocks.pos}
            onChange={(axis, val) => cb.setAxisLock(o.id, "pos", axis, val)}
          />
        )}
        <Vec3Field
          label="Rotation"
          value={xf.rot}
          disabled={locked}
          onChange={(rot) => cb.xf(o.id, { ...xf, rot })}
        />
        {!locked && (
          <AxisLockRow
            locks={axisLocks.rot}
            onChange={(axis, val) => cb.setAxisLock(o.id, "rot", axis, val)}
          />
        )}
        <Vec3Field
          label="Scale"
          value={xf.scl}
          decimals={2}
          step={0.1}
          disabled={locked}
          onChange={(scl) => cb.xf(o.id, { ...xf, scl })}
        />
        {!locked && (
          <AxisLockRow
            locks={axisLocks.scl}
            onChange={(axis, val) => cb.setAxisLock(o.id, "scl", axis, val)}
          />
        )}
      </div>

      {geo && !locked && (
        <div className="sec">
          <div className="lbl">Extrude</div>
          <Slider
            label="Depth"
            value={geo.depth}
            min={5}
            max={80}
            unit=" mm"
            onChange={(depth) => cb.setExtrude(o.id, { depth })}
          />
          <Slider
            label="Bevel size"
            value={geo.bevel}
            min={0}
            max={8}
            step={0.5}
            unit=" mm"
            onChange={(bevel) => cb.setExtrude(o.id, { bevel })}
          />
          <Slider
            label="Curve segments"
            value={geo.seg}
            min={4}
            max={32}
            onChange={(seg) => cb.setExtrude(o.id, { seg })}
          />
          {o.edits && (
            <div
              className="box"
              style={{ margin: "0 0 12px", padding: 10, fontSize: 11 }}
            >
              Changing extrude settings or the outline discards this object's
              vertex edits (Undo brings them back).
            </div>
          )}
          <button
            className="btn blk"
            style={{ padding: 10 }}
            onClick={() => go("06")}
          >
            Edit outline in Sketch →
          </button>
        </div>
      )}

      {isImport && (
        <div className="sec">
          <div className="box" style={{ padding: 10, fontSize: 11 }}>
            Imported {o.geo.kind === "import" && o.geo.format.toUpperCase()}{" "}
            model · keeps its own materials.
          </div>
        </div>
      )}

      {!isImport && !locked && (
        <div className="sec">
          <div className="lbl">Material</div>
          <div className="sws">
            {MATERIAL_SWATCHES.map((c) => (
              <i
                key={c}
                className={"swc" + (o.color === c ? " on" : "")}
                style={{ background: c }}
                onClick={() => cb.color(o.id, c)}
              />
            ))}
          </div>
        </div>
      )}

      {!isImport && !locked && (
        <div className="sec">
          <div className="lbl">Mesh</div>
          <div className="g2">
            <button
              className="btn"
              style={{ padding: 10 }}
              onClick={() => go("07")}
            >
              Edit vertices →
            </button>
            <button
              className="btn"
              style={{ padding: 10 }}
              disabled={!o.edits}
              onClick={() => cb.clearEdits(o.id)}
            >
              Clear edits
            </button>
          </div>
        </div>
      )}

      {!locked && (
        <div className="sec">
          <button
            className="btn blk"
            style={{ padding: 10, color: "var(--rd)" }}
            onClick={() => cb.deleteObject(o.id)}
          >
            Delete {isImport ? "model" : "object"}
          </button>
        </div>
      )}
    </>
  );
}
