import { EditorState } from "../../state/useEditorState";
import PanelHeader from "../ui/PanelHeader";
import Slider from "../ui/Slider";

/** Camera screen: perspective projection settings. */
export default function CameraInspector({ ui, cb }: EditorState) {
  return (
    <>
      <PanelHeader title="Perspective camera" subtitle="Active viewport · top-right" />
      <div className="sec">
        <div className="lbl">Projection</div>
        <Slider
          label="Field of view"
          value={ui.fov}
          min={20}
          max={100}
          unit="°"
          onChange={(fov) => cb.ui({ fov })}
        />
      </div>
    </>
  );
}
