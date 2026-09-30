import { setModelBytes } from "../state/modelStore";
import { ImportEntry, ImportFormat } from "../types";

export const IMPORT_ACCEPT = ".glb,.gltf,.obj,.stl";

/**
 * Reads a user-picked 3D file, stashes its bytes in the model store and hands
 * back the layer entry to add. Unsupported extensions show an alert.
 */
export function readImportFile(
  file: File,
  onReady: (entry: ImportEntry) => void,
) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const format: ImportFormat | null =
    ext === "glb" || ext === "gltf" || ext === "obj" || ext === "stl"
      ? ext
      : null;
  if (!format) {
    alert("Supported formats: .glb, .gltf, .obj, .stl");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (!(reader.result instanceof ArrayBuffer)) return;
    const id = "import-" + Math.random().toString(36).slice(2, 8);
    setModelBytes(id, reader.result);
    onReady({ id, name: file.name.replace(/\.[^.]+$/, ""), format });
  };
  reader.readAsArrayBuffer(file);
}
