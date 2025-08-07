import { create, type StateCreator } from "zustand";
import { persist, createJSONStorage, type PersistOptions } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval"; // ✅ IndexedDB wrapper with renamed methods
import { undoRedoActions } from "./actions/undoRedo";
import { storyTitleActions } from "./actions/storyTitle";
import { nodeUpdateActions } from "./actions/nodeUpdate";
import { nodeCrudActions } from "./actions/nodeCreateDelete";
import { mediaActions } from "./actions/mediaActions";
import { chronologyActions } from "./actions/chronologyActions";
import { useImageStore } from "../imageStore/imageStore";

import type { StoryState } from "./types";

// ✅ Create a blank story
export const createBlankStory = (): StoryState["story"] => ({
  title: "Untitled Story",
  chapters: [],
});

type StoreWithExtras = StoryState & {
  past: any[];
  future: any[];
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  updateStoryTitle: (title: string) => void;
  resetStory: () => void;
};

// ✅ Explicit persist typing
type PersistedStore = StateCreator<
  StoreWithExtras,
  [["zustand/persist", unknown]]
>;

export const useStoryStore = create<StoreWithExtras>()(
  persist(
    ((set, get) => ({
      story: createBlankStory(),
      selectedNodeId: null,
      ...undoRedoActions(set, get),
      ...storyTitleActions(set, get),
      ...nodeUpdateActions(set, get),
      ...nodeCrudActions(set, get),
      ...mediaActions(set, get),
      ...chronologyActions(set, get),

      resetStory: () => {
        const store = get();

        // 🧠 Take snapshot of current state BEFORE clearing
        const snapshot = {
          story: structuredClone(store.story),
          images: structuredClone(useImageStore.getState().imageMap),
        };

        // 🗑 Clear IndexedDB
        idbDel("draftscape-story");

        // 🆕 Set blank story
        const blank = createBlankStory();
        set({
          story: structuredClone(blank),
          selectedNodeId: null,
          past: [...store.past, snapshot],
          future: [],
        });

        // 🔄 Persist blank story
        idbSet("draftscape-story", { state: { story: blank } });
        console.log("🆕 [Reset] Blank story set and old state pushed to undo stack");
      },
    })) as PersistedStore,
    {
      name: "draftscape-story",
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const value = await idbGet(name);
          return value ?? null; // ✅ normalize undefined to null
        },
        setItem: (name, value) => idbSet(name, value),
        removeItem: (name) => idbDel(name),
      })),
      partialize: (state) => ({ story: state.story }),
    }
  )
);

// ✅ Utility for imports or replacing story (undoable)
export const resetStoryState = (newStory: StoryState["story"] | null = null) => {
  const story = newStory ?? createBlankStory();
  const store = useStoryStore.getState();

  // Snapshot current state
  const snapshot = {
    story: structuredClone(store.story),
    images: structuredClone(useImageStore.getState().imageMap),
  };

  // Reset both story and images
  useStoryStore.setState({
    story: structuredClone(story),
    selectedNodeId: null,
    past: [...store.past, snapshot],
    future: [],
  });
  useImageStore.getState().setImages({}); // Clear images for blank/import

  // Persist story text only
  idbSet("draftscape-story", { state: { story } });

  console.log("📥 [Import] Story imported (images handled separately)");
};