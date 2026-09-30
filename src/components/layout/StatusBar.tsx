import { EditorState } from "../../state/useEditorState";
import { ScreenId } from "../../types";
import { sketchTarget } from "../../utils/objects";

type Props = { screen: ScreenId; editor: EditorState };

/** Live status line for the current screen. */
export default function StatusBar({ screen, editor }: Props) {
  const { doc, ui, stats, selectedObj } = editor;
  const fps = `FPS ${stats.fps || "–"}`;
  let items: string[];
  if (screen === "06") {
    const t = sketchTarget(doc.objects, ui.selected);
    const pts = t ? t.geo.pts : ui.draft;
    items = [
      "Tool Pen",
      "Snap grid 10 mm",
      t ? `Outline · ${t.name}` : "New outline (draft)",
      `Points ${pts.length}`,
    ];
  } else if (screen === "07") {
    items = [
      "Mode Vertex",
      selectedObj ? `Editing ${selectedObj.name}` : "Nothing selected",
      `Selected ${stats.verts.v.length} / ${stats.verts.total}`,
      fps,
    ];
  } else if (screen === "08") {
    items = ["Camera Perspective", `FOV ${ui.fov}°`, "Viewports 4", fps];
  } else {
    items = [
      `Objects ${doc.objects.length}`,
      `Selected ${selectedObj?.name ?? "—"}`,
      fps,
      "Three.js r169",
    ];
  }
  return (
    <footer className="stat">
      {items.map((s) => (
        <span key={s}>{s}</span>
      ))}
    </footer>
  );
}
