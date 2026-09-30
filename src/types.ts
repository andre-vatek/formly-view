// Shared data types for the editor. UI coordinates are "Figma space" (Z up);
// the viewport converts them to three.js space (Y up) — see viewport/transforms.ts.

/** Screen ids double as URL hashes (#05 … #08). */
export type ScreenId = "05" | "06" | "07" | "08";

export type XYZ = [number, number, number];
/** Sketch point (mm). A "bezier" point is the control point of a curve
 *  from the previous point to the next one. */
export type Pt = { x: number; y: number; t: "corner" | "bezier" };
export type Vtx = { id: number; p: XYZ };
export type Curve = "smooth" | "linear" | "sharp" | "root";
export type Xform = { pos: XYZ; rot: XYZ; scl: XYZ };
export type AxisLock = [boolean, boolean, boolean];
export type Locks = { pos: AxisLock; rot: AxisLock; scl: AxisLock };

export type ShapeKind = "box" | "sphere" | "cylinder" | "cone";
export type ImportFormat = "glb" | "gltf" | "obj" | "stl";

export type ExtrudeGeo = {
  kind: "extrude";
  /** Closed outline in the sketch plane (mm) */
  pts: Pt[];
  depth: number;
  bevel: number;
  seg: number;
};

/** How an object's geometry is generated (in the object's local space). */
export type Geo =
  | ExtrudeGeo
  /** `copies` = local three.js offsets; omitted means one box at the origin */
  | { kind: "box"; size: XYZ; copies?: XYZ[] }
  | { kind: "sphere" | "cylinder" | "cone" }
  | { kind: "import"; format: ImportFormat };

/** Vertex edits baked on top of the generated geometry. They only apply while
 *  the geometry spec still matches `sig`. */
export type VertexEdits = { id: string; sig: string; pos: Float32Array };

export type SceneObject = {
  id: string;
  name: string;
  color: string;
  xform: Xform;
  geo: Geo;
  /** Layer lock: can be selected but not transformed or edited */
  locked?: boolean;
  /** Per-axis gizmo locks */
  axisLocks?: Locks;
  edits?: VertexEdits;
};

/** Everything that is saved in the undo history. */
export type Doc = { objects: SceneObject[] };

/** View / tool state — not part of undo. */
export type UiState = {
  selected: string | null;
  fov: number;
  falloff: number;
  curve: Curve;
  /** Pending vertex move (Edit Vertices), not yet applied */
  move: XYZ;
  cmd: { n: number; k: "apply" | "reset" };
  /** Active point on the Sketch screen */
  active: number;
  /** New outline being drawn when no extrusion is selected */
  draft: Pt[];
};

/** What the viewport reads every frame. */
export type ViewParams = { objects: SceneObject[]; ui: UiState };

export type ImportEntry = { id: string; name: string; format: ImportFormat };

/** Live info the viewport reports back for panels and the status bar. */
export type Stats = {
  fps: number;
  /** Selected vertices (world coords), affected neighbours, total vertices */
  verts: { v: Vtx[]; affected: number; total: number };
};

/** Callbacks the viewport and panels use to update editor state. */
export type Cb = {
  select: (id: string | null) => void;
  xf: (id: string, xform: Xform) => void;
  color: (id: string, color: string) => void;
  setExtrude: (
    id: string,
    patch: Partial<Pick<ExtrudeGeo, "depth" | "bevel" | "seg">>,
  ) => void;
  /** Sketch points for the current target (selected extrusion, or the draft) */
  sketch: (pts: Pt[], active: number) => void;
  extrudeDraft: () => void;
  addShape: (kind: ShapeKind) => void;
  addImport: (entry: ImportEntry) => void;
  deleteObject: (id: string) => void;
  setLayerLock: (id: string, locked: boolean) => void;
  setAxisLock: (
    id: string,
    kind: keyof Locks,
    axis: 0 | 1 | 2,
    val: boolean,
  ) => void;
  setEdits: (id: string, pos: Float32Array, sig: string, count: number) => void;
  clearEdits: (id: string) => void;
  ui: (patch: Partial<UiState>) => void;
  verts: (v: Vtx[], affected: number, total: number) => void;
  fps: (fps: number) => void;
  undo: () => void;
  redo: () => void;
  jump: (index: number) => void;
};
