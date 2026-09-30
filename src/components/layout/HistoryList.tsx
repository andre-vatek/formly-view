import { EditorState } from "../../state/useEditorState";

const MAX_SHOWN = 14;
const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

/** Undo history, newest first. Click an entry to jump back (or forward) to it. */
export default function HistoryList({ editor }: { editor: EditorState }) {
  const { history, cb } = editor;
  const entries = history.labels
    .map((label, i) => ({ label, i }))
    .reverse()
    .slice(0, MAX_SHOWN);

  return (
    <div className="hist">
      <div className="lbl">
        <span>History</span>
        <span className="ur">
          <button
            title={`Undo (${MOD}Z)`}
            disabled={!history.canUndo}
            onClick={cb.undo}
          >
            ↶
          </button>
          <button
            title={`Redo (${MOD}Shift+Z)`}
            disabled={!history.canRedo}
            onClick={cb.redo}
          >
            ↷
          </button>
        </span>
      </div>
      {entries.map(({ label, i }) => (
        <div
          key={i}
          className={
            "hi" +
            (i === history.index ? " on" : "") +
            (i > history.index ? " fut" : "")
          }
          onClick={() => cb.jump(i)}
        >
          <span className="hl">{label}</span>
        </div>
      ))}
    </div>
  );
}
