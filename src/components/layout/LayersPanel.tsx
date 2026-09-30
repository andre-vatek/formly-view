import { useRef } from "react";
import { IMPORT_SWATCH } from "../../config/document";
import { EditorState } from "../../state/useEditorState";
import { ScreenId, ShapeKind } from "../../types";
import { IMPORT_ACCEPT, readImportFile } from "../../utils/importFile";
import HistoryList from "./HistoryList";

const SHAPE_KINDS: ShapeKind[] = ["box", "sphere", "cylinder", "cone"];

type Props = { screen: ScreenId; editor: EditorState };

/** Left sidebar: the document's objects (same on every screen) and history. */
export default function LayersPanel({ screen, editor }: Props) {
  const { doc, ui, cb } = editor;
  const fileRef = useRef<HTMLInputElement>(null);
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) readImportFile(file, cb.addImport);
  };

  return (
    <aside className="left">
      <div className="lhead">
        <span className="h">Layers</span>
        <span className="dim" style={{ fontSize: 11 }}>
          {doc.objects.length}
        </span>
      </div>

      {screen === "05" && (
        <div
          className="row"
          style={{ gap: 6, padding: "0 8px 10px", flexWrap: "wrap" }}
        >
          {SHAPE_KINDS.map((k) => (
            <button
              key={k}
              className="btn"
              style={{
                padding: "6px 10px",
                fontSize: 11,
                textTransform: "capitalize",
              }}
              onClick={() => cb.addShape(k)}
            >
              + {k}
            </button>
          ))}
          <button
            className="btn"
            style={{ padding: "6px 10px", fontSize: 11 }}
            onClick={() => fileRef.current?.click()}
          >
            + Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={IMPORT_ACCEPT}
            style={{ display: "none" }}
            onChange={handleImportFile}
          />
        </div>
      )}

      {doc.objects.map((o) => (
        <div
          key={o.id}
          className={
            "layer" +
            (ui.selected === o.id ? " sel" : "") +
            (o.locked ? " off" : "")
          }
          style={{ cursor: "pointer" }}
          onClick={() => cb.select(o.id)}
        >
          <span
            className="sw"
            style={{
              background: o.geo.kind === "import" ? IMPORT_SWATCH : o.color,
            }}
          />
          <span className="n">
            {o.name}
            {o.edits && (
              <span style={{ color: "var(--am)" }} title="Has vertex edits">
                {" "}
                •
              </span>
            )}
          </span>
          {o.geo.kind === "import" && <span className="t">{o.geo.format}</span>}
          <span
            className="act"
            title={o.locked ? "Unlock layer" : "Lock layer"}
            style={{ color: o.locked ? "var(--am)" : undefined }}
            onClick={(e) => {
              e.stopPropagation();
              cb.setLayerLock(o.id, !o.locked);
            }}
          >
            {o.locked ? "🔒" : "🔓"}
          </span>
          {!o.locked && (
            <span
              className="act"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                cb.deleteObject(o.id);
              }}
            >
              ✕
            </span>
          )}
        </div>
      ))}

      <HistoryList editor={editor} />
    </aside>
  );
}
