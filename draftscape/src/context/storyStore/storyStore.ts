// src/context/storyStore/storyStore.ts
import { create, type StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

import { undoRedoActions } from "./actions/undoRedo";
import { storyTitleActions } from "./actions/storyTitle";
import { genericNodeActions } from "./actions/genericNodeActions";

// ✅ new flat-structure CRUD slices
import { chapterActions } from "./actions/chapterActions";
import { sceneActions } from "./actions/sceneActions";
import { textActions } from "./actions/textActions";

// Reparenting

import { moveNodeActions } from "./actions/moveNodeActions";

// Media 
import { pictureActions } from "./actions/pictureActions";
import { eventActions } from "./actions/eventActions";
import { annotationActions } from "./actions/annotationActions";

import { useImageStore } from "../imageStore/imageStore";
import type { StoryState } from "./types";

// ✅ Create a blank story in the NEW flat shape
export const createBlankStory = (): StoryState["story"] => ({
  title: "Untitled Story",
  nodeMap: {},        // all nodes live here
  order: [],          // ordered list of top-level chapter IDs
  childrenOrder: {},  // parentId -> ordered child IDs
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

      // History + misc
      ...undoRedoActions(set, get),
      ...storyTitleActions(set, get),
      ...genericNodeActions(set, get),

      // ✅ New CRUD (flat)
      ...chapterActions(set as any, get as any),
      ...sceneActions(set as any, get as any),
      ...textActions(set as any, get as any),

      // Media
      ...pictureActions(set as any, get as any),
      ...eventActions(set as any, get as any),
      ...annotationActions(set as any, get as any),

      // Reparenting
      ...moveNodeActions(set as any, get as any),

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

      setStoryNoHistory: (story) => {
        // write the new story state WITHOUT touching past/future
        // (persist middleware will still save it to IndexedDB automatically)
        set({ story: structuredClone(story) });
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
