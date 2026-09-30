import { EditorState } from "../../state/useEditorState";
import { ScreenId } from "../../types";
import CameraInspector from "./CameraInspector";
import ModelInspector from "./ModelInspector";
import SketchInspector from "./SketchInspector";
import VerticesInspector from "./VerticesInspector";

type Props = {
  screen: ScreenId;
  editor: EditorState;
  go: (s: ScreenId) => void;
};

/** Right-hand panel; picks the inspector for the current screen. */
export default function Inspector({ screen, editor, go }: Props) {
  return (
    <aside className="right">
      {screen === "05" ? (
        <ModelInspector {...editor} go={go} />
      ) : screen === "06" ? (
        <SketchInspector {...editor} go={go} />
      ) : screen === "07" ? (
        <VerticesInspector {...editor} />
      ) : (
        <CameraInspector {...editor} />
      )}
    </aside>
  );
}
