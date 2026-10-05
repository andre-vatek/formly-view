import { useRef, useState } from "react";
import {
  DOC_TITLE,
  INITIAL_OBJECTS,
  NEW_EXTRUDE,
  NO_LOCK,
  SHAPE_PALETTE,
} from "../config/document";
import {
  Cb,
  Doc,
  SceneObject,
  ShapeKind,
  Stats,
  UiState,
  Xform,
} from "../types";
import { findObject, sketchTarget } from "../utils/objects";

type HistEntry = { doc: Doc; label: string };
type Store = {
  states: HistEntry[];
  index: number;
  /** True between gesture(true) and gesture(false): one drag, or one field
   *  being edited. Commits with the same key inside a gesture are merged
   *  into a single history entry; everything else is its own entry. */
  gesture: boolean;
  /** Key of the last commit made in the current gesture */
  key: string | null;
  ui: UiState;
};

const LOCK_VERB = { pos: "move", rot: "rotate", scl: "scale" } as const;
const MAX_HISTORY = 100;

const INITIAL_UI: UiState = {
  selected: "seat",
  fov: 50,
  falloff: 36,
  curve: "smooth",
  move: [0, 0, 0],
  cmd: { n: 0, k: "reset" },
  active: 5,
  draft: [],
};

const INITIAL_STORE: Store = {
  states: [{ doc: { objects: INITIAL_OBJECTS }, label: "Open " + DOC_TITLE }],
  index: 0,
  gesture: false,
  key: null,
  ui: INITIAL_UI,
};

const SHAPE_SIZE: Record<ShapeKind, SceneObject["geo"]> = {
  box: { kind: "box", size: [36, 36, 36] },
  sphere: { kind: "sphere" },
  cylinder: { kind: "cylinder" },
  cone: { kind: "cone" },
};

const newId = (prefix: string) =>
  prefix + "-" + Math.random().toString(36).slice(2, 8);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const nextName = (objects: SceneObject[], base: string) => {
  let n = 1;
  while (objects.some((o) => o.name === `${base} ${n}`)) n++;
  return `${base} ${n}`;
};
const DEFAULT_XFORM: Xform = { pos: [0, 60, 0], rot: [0, 0, 0], scl: [1, 1, 1] };

/** Replace one object in the doc (returns null when it doesn't exist). */
const patchObject = (
  doc: Doc,
  id: string,
  f: (o: SceneObject) => SceneObject | null,
): Doc | null => {
  const o = findObject(doc.objects, id);
  const next = o && f(o);
  if (!next) return null;
  return { objects: doc.objects.map((x) => (x.id === id ? next : x)) };
};

/** Push a new document state onto the history (or, within one gesture,
 *  replace the entry that gesture already created). */
const pushHistory = (
  s: Store,
  doc: Doc,
  label: string,
  key: string | null,
  ui?: Partial<UiState>,
): Store => {
  const states = s.states.slice(0, s.index + 1);
  const entry = { doc, label };
  if (s.gesture && key !== null && s.key === key && states.length > 1)
    states[states.length - 1] = entry;
  else states.push(entry);
  if (states.length > MAX_HISTORY) states.shift();
  return {
    ...s,
    states,
    index: states.length - 1,
    key,
    ui: ui ? { ...s.ui, ...ui } : s.ui,
  };
};

/** Active sketch point when the Sketch screen switches to a new target. */
const activeFor = (doc: Doc, ui: UiState, selected: string | null) => {
  const t = sketchTarget(doc.objects, selected);
  return Math.max(0, (t ? t.geo.pts.length : ui.draft.length) - 1);
};

/**
 * Editor state: the document (objects, with undo history) plus UI/tool state.
 * `cb` is created once and only uses functional updates, so it is safe to
 * hand to the three.js loop.
 */
export function useEditorState() {
  const [s, setS] = useState<Store>(INITIAL_STORE);
  const [stats, setStats] = useState<Stats>({
    fps: 0,
    verts: { v: [], affected: 0, total: 0 },
  });

  const cb = useRef<Cb>(null as unknown as Cb);
  if (!cb.current) {
    /** Commit a document change to history. `f` returns null for no-op. */
    const commit = (
      label: string | ((s: Store) => string),
      key: string | null,
      f: (doc: Doc, s: Store) => Doc | null,
      ui?: (doc: Doc, s: Store) => Partial<UiState>,
    ) =>
      setS((s) => {
        const doc = s.states[s.index].doc;
        const next = f(doc, s);
        if (!next) return s;
        return pushHistory(
          s,
          next,
          typeof label === "string" ? label : label(s),
          key,
          ui?.(next, s),
        );
      });
    /** Move through history (undo / redo / click an entry). */
    const goTo = (target: (s: Store) => number) =>
      setS((s) => {
        const i = target(s);
        if (i < 0 || i >= s.states.length || i === s.index) return s;
        const doc = s.states[i].doc;
        return {
          ...s,
          index: i,
          key: null,
          ui: {
            ...s.ui,
            move: [0, 0, 0],
            active: Math.min(s.ui.active, activeFor(doc, s.ui, s.ui.selected)),
          },
        };
      });
    const nameOf = (s: Store, id: string) =>
      findObject(s.states[s.index].doc.objects, id)?.name ?? id;
    const editable = (o: SceneObject) => (o.locked ? null : o);

    cb.current = {
      select: (id) =>
        setS((s) => ({
          ...s,
          ui: {
            ...s.ui,
            selected: id,
            active: activeFor(s.states[s.index].doc, s.ui, id),
            move: [0, 0, 0],
          },
        })),

      xf: (id, xform) =>
        commit(
          (s) => "Transform " + nameOf(s, id),
          "xf:" + id,
          (doc) => patchObject(doc, id, (o) => editable(o) && { ...o, xform }),
        ),

      color: (id, color) =>
        commit(
          (s) => "Color " + nameOf(s, id),
          "color:" + id,
          (doc) =>
            patchObject(
              doc,
              id,
              (o) =>
                o.geo.kind !== "import" && !o.locked ? { ...o, color } : null,
            ),
        ),

      setExtrude: (id, patch) =>
        commit(
          (s) => "Extrude settings " + nameOf(s, id),
          "extrude:" + id,
          (doc) =>
            patchObject(
              doc,
              id,
              (o) =>
                o.geo.kind === "extrude" && !o.locked
                  ? { ...o, geo: { ...o.geo, ...patch }, edits: undefined }
                  : null,
            ),
        ),

      sketch: (pts, active) =>
        setS((s) => {
          const doc = s.states[s.index].doc;
          const target = sketchTarget(doc.objects, s.ui.selected);
          if (!target) return { ...s, ui: { ...s.ui, draft: pts, active } };
          if (pts.length < 3) return s; // an extrusion needs a closed outline
          // Just selecting a point changes nothing in the document
          if (pts === target.geo.pts) return { ...s, ui: { ...s.ui, active } };
          const next = patchObject(doc, target.id, (o) => ({
            ...o,
            geo: { ...target.geo, pts },
            edits: undefined,
          }))!;
          return pushHistory(
            s,
            next,
            "Edit outline " + target.name,
            "outline:" + target.id,
            { active },
          );
        }),

      extrudeDraft: () => {
        const id = newId("extrude");
        commit(
          (s) => `Extrude “${nextName(s.states[s.index].doc.objects, "Extrusion")}”`,
          null,
          (doc, s) =>
            s.ui.draft.length < 3
              ? null
              : {
                  objects: [
                    ...doc.objects,
                    {
                      id,
                      name: nextName(doc.objects, "Extrusion"),
                      color:
                        SHAPE_PALETTE[doc.objects.length % SHAPE_PALETTE.length],
                      xform: { pos: [0, 0, 15], rot: [0, 0, 0], scl: [1, 1, 1] },
                      geo: { kind: "extrude", pts: s.ui.draft, ...NEW_EXTRUDE },
                    },
                  ],
                },
          (doc, s) => ({
            selected: id,
            draft: [],
            active: s.ui.draft.length - 1,
          }),
        );
      },

      addShape: (kind) => {
        const id = newId("shape");
        commit(
          (s) => "Add " + nextName(s.states[s.index].doc.objects, cap(kind)),
          null,
          (doc) => ({
            objects: [
              ...doc.objects,
              {
                id,
                name: nextName(doc.objects, cap(kind)),
                color: SHAPE_PALETTE[doc.objects.length % SHAPE_PALETTE.length],
                xform: DEFAULT_XFORM,
                geo: SHAPE_SIZE[kind],
              },
            ],
          }),
          () => ({ selected: id }),
        );
      },

      addImport: (entry) =>
        commit(
          "Import " + entry.name,
          null,
          (doc) => ({
            objects: [
              ...doc.objects,
              {
                id: entry.id,
                name: entry.name,
                color: "#e8e9f0",
                xform: DEFAULT_XFORM,
                geo: { kind: "import", format: entry.format },
              },
            ],
          }),
          () => ({ selected: entry.id }),
        ),

      deleteObject: (id) =>
        commit(
          (s) => "Delete " + nameOf(s, id),
          null,
          (doc) => {
            const o = findObject(doc.objects, id);
            if (!o || o.locked) return null;
            return { objects: doc.objects.filter((x) => x.id !== id) };
          },
          (_, s) => (s.ui.selected === id ? { selected: null } : {}),
        ),

      setLayerLock: (id, locked) =>
        commit(
          (s) => (locked ? "Lock " : "Unlock ") + nameOf(s, id),
          null,
          (doc) => patchObject(doc, id, (o) => ({ ...o, locked })),
        ),

      setAxisLock: (id, kind, axis, val) =>
        commit(
          (s) =>
            `${val ? "Lock" : "Unlock"} ${LOCK_VERB[kind]} ${"XYZ"[axis]} · ${nameOf(s, id)}`,
          null,
          (doc) =>
            patchObject(doc, id, (o) => {
              const cur = { ...NO_LOCK, ...o.axisLocks };
              const arr = cur[kind].slice() as typeof cur.pos;
              arr[axis] = val;
              return { ...o, axisLocks: { ...cur, [kind]: arr } };
            }),
        ),

      setEdits: (id, pos, sig, count) =>
        commit(
          (s) => `Move ${count} vert${count === 1 ? "ex" : "ices"} · ${nameOf(s, id)}`,
          null,
          (doc) =>
            patchObject(
              doc,
              id,
              (o) =>
                editable(o) && { ...o, edits: { id: newId("edit"), sig, pos } },
            ),
        ),

      clearEdits: (id) =>
        commit(
          (s) => "Clear vertex edits · " + nameOf(s, id),
          null,
          (doc) =>
            patchObject(doc, id, (o) =>
              o.edits && editable(o) ? { ...o, edits: undefined } : null,
            ),
        ),

      ui: (patch) => setS((s) => ({ ...s, ui: { ...s.ui, ...patch } })),

      verts: (v, affected, total) =>
        setStats((o) => ({ ...o, verts: { v, affected, total } })),
      fps: (fps) => setStats((o) => (o.fps === fps ? o : { ...o, fps })),

      gesture: (active) =>
        setS((s) =>
          s.gesture === active && s.key === null
            ? s
            : { ...s, gesture: active, key: null },
        ),
      undo: () => goTo((s) => s.index - 1),
      redo: () => goTo((s) => s.index + 1),
      jump: (i) => goTo(() => i),
    };
  }

  const doc = s.states[s.index].doc;
  const selectedObj = findObject(doc.objects, s.ui.selected);
  return {
    doc,
    ui: s.ui,
    stats,
    selectedObj,
    history: {
      labels: s.states.map((e) => e.label),
      index: s.index,
      canUndo: s.index > 0,
      canRedo: s.index < s.states.length - 1,
    },
    cb: cb.current,
  };
}

export type EditorState = ReturnType<typeof useEditorState>;
