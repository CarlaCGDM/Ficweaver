import { useImageStore } from "../../imageStore/imageStore";
import type { Story } from "../types";
import { set as idbSet } from "idb-keyval"; // ✅ for persistence sync
import { useLayoutStore } from "../../uiStore/layoutStore";

export const undoRedoActions = (set: any, get: any) => ({
  past: [] as { story: Story; images: Record<string, File> }[],
  future: [] as { story: Story; images: Record<string, File> }[],

  undo: () => {
    const { past = [], future = [], story } = get();
    if (past.length === 0) return;

    const snapshot = past[past.length - 1];

    // ⛔ Pause auto-layout while we swap the story
    useLayoutStore.getState().setSuppress(true);

    set({
      story: structuredClone(snapshot.story),
      past: past.slice(0, -1),
      future: [...future, { story: structuredClone(story) }],
    });

    // ✅ Let components re-measure but DO NOT shift based on that re-measure
    requestAnimationFrame(() => {
      useLayoutStore.getState().setSuppress(false);
    });
  },
 redo: () => {
  const { past = [], future = [], story } = get();
  if (future.length === 0) return;

  const snapshot = future[future.length - 1];

  useLayoutStore.getState().setSuppress(true);

  set({
    story: structuredClone(snapshot.story),
    past: [...past, { story: structuredClone(story) }],
    future: future.slice(0, -1),
  });

  requestAnimationFrame(() => {
    useLayoutStore.getState().setSuppress(false);
  });
},
  pushHistory: () => {
    const { past, story } = get();
    const imageStore = useImageStore.getState();

    const snapshot = {
      story: structuredClone(story),
      images: structuredClone(imageStore.imageMap),
    };

    set({
      past: past.length >= 50 ? [...past.slice(1), snapshot] : [...past, snapshot],
      future: [], // clear redo stack
    });

    console.log("💾 [History] Pushed new snapshot (story + images)");
  },
});
