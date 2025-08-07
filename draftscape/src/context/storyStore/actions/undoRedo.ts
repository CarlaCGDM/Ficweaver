import { useImageStore } from "../../imageStore/imageStore";
import type { Story } from "../types";
import { set as idbSet } from "idb-keyval"; // ✅ for persistence sync

export const undoRedoActions = (set: any, get: any) => ({
  past: [] as { story: Story; images: Record<string, File> }[],
  future: [] as { story: Story; images: Record<string, File> }[],

  undo: async () => {
    const { past, future, story } = get();
    const imageStore = useImageStore.getState();

    if (past.length === 0) return;

    // ✅ Save current state into future
    const currentSnapshot = {
      story: structuredClone(story),
      images: structuredClone(imageStore.imageMap),
    };
    const previous = past[past.length - 1];

    // ✅ Restore previous story (deep clone for UI refresh)
    const restoredStory = structuredClone(previous.story);
    set({
      story: restoredStory,
      past: past.slice(0, -1),
      future: [currentSnapshot, ...future],
    });

    // ✅ Restore images
    imageStore.setImages(previous.images);

    // ✅ Sync persistence (IndexedDB)
    await idbSet("draftscape-story", { state: { story: restoredStory } });

    console.log("↩️ [Undo] Story and images reverted");
  },

  redo: async () => {
    const { past, future, story } = get();
    const imageStore = useImageStore.getState();

    if (future.length === 0) return;

    const currentSnapshot = {
      story: structuredClone(story),
      images: structuredClone(imageStore.imageMap),
    };
    const next = future[0];

    // ✅ Restore next story (deep clone)
    const restoredStory = structuredClone(next.story);
    set({
      story: restoredStory,
      past: [...past, currentSnapshot],
      future: future.slice(1),
    });

    // ✅ Restore images
    imageStore.setImages(next.images);

    // ✅ Sync persistence
    await idbSet("draftscape-story", { state: { story: restoredStory } });

    console.log("↪️ [Redo] Story and images reapplied");
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
