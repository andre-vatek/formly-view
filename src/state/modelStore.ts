// Imported model bytes live here, outside React state, because:
// 1) ArrayBuffers aren't the kind of thing you want in serializable app state, and
// 2) Viewport fully remounts on every screen switch (App.tsx renders it with key={screen}), so this
//    needs to survive that remount without going through props.
// Bytes are kept even after a model is deleted so that Undo can bring it back.
// This is in-memory only — a page reload loses imported models.
const store = new Map<string, ArrayBuffer>();
export const setModelBytes = (id: string, buf: ArrayBuffer) =>
  store.set(id, buf);
export const getModelBytes = (id: string) => store.get(id);
