import { ExtrudeGeo, SceneObject } from "../types";

export const findObject = (objects: SceneObject[], id: string | null) =>
  id ? objects.find((o) => o.id === id) : undefined;

/** Can this object's vertices be edited / transformed? (not imports, not locked) */
export const isEditableMesh = (o: SceneObject | undefined) =>
  !!o && o.geo.kind !== "import" && !o.locked;

export type ExtrudeObject = SceneObject & { geo: ExtrudeGeo };

/** The extrusion whose outline the Sketch screen edits, or undefined when
 *  the Sketch screen should work on a new draft outline instead. */
export const sketchTarget = (
  objects: SceneObject[],
  selected: string | null,
): ExtrudeObject | undefined => {
  const o = findObject(objects, selected);
  return o && o.geo.kind === "extrude" && !o.locked
    ? (o as ExtrudeObject)
    : undefined;
};
