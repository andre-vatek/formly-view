import { useEffect, useRef } from "react";
import Inspector from "./components/inspector/Inspector";
import LayersPanel from "./components/layout/LayersPanel";
import StatusBar from "./components/layout/StatusBar";
import ToolRail from "./components/layout/ToolRail";
import TopBar from "./components/layout/TopBar";
import { SCREENS } from "./config/screens";
import { EditorState, useEditorState } from "./state/useEditorState";
import { useScreenRoute } from "./state/useScreenRoute";
import { ScreenId } from "./types";
import { sketchTarget } from "./utils/objects";
import Viewport from "./viewport/Viewport";

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;

/** Undo / redo everywhere; Delete removes the selected object (Model 3D) or
 *  the active point (Sketch 2D). */
function useShortcuts(screen: ScreenId, editor: EditorState) {
  const latest = useRef({ screen, editor });
  latest.current = { screen, editor };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return; // leave native undo to text fields
      const { screen, editor } = latest.current;
      const { cb, doc, ui } = editor;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && (k === "z" || k === "y")) {
        e.preventDefault();
        if (k === "y" || e.shiftKey) cb.redo();
        else cb.undo();
      } else if (k === "delete" || k === "backspace") {
        if (screen === "05" && ui.selected) cb.deleteObject(ui.selected);
        if (screen === "06") {
          const t = sketchTarget(doc.objects, ui.selected);
          const pts = t ? t.geo.pts : ui.draft;
          if (pts.length > (t ? 3 : 0))
            cb.sketch(
              pts.filter((_, j) => j !== ui.active),
              Math.max(0, ui.active - 1),
            );
        }
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
}

export default function App() {
  const [screen, go] = useScreenRoute();
  const editor = useEditorState();
  const meta = SCREENS[screen];
  useShortcuts(screen, editor);
  // A vertex move that wasn't applied doesn't survive leaving the screen.
  useEffect(() => {
    editor.cb.ui({ move: [0, 0, 0] });
    editor.cb.gesture(false); // never carry an open gesture across screens
  }, [screen]);

  return (
    <div className="app">
      <TopBar meta={meta} edited={editor.history.index > 0} go={go} />
      <ToolRail screen={screen} go={go} />
      <LayersPanel screen={screen} editor={editor} />
      <main className="view">
        <Viewport
          key={screen}
          mode={screen}
          view={{ objects: editor.doc.objects, ui: editor.ui }}
          cb={editor.cb}
        />
        <div className="hint">{meta.hint}</div>
      </main>
      <StatusBar screen={screen} editor={editor} />
      <Inspector screen={screen} editor={editor} go={go} />
    </div>
  );
}
