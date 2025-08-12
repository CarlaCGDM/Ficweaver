// src/context/storyStore/actions/sceneActions.ts
import { nanoid } from "nanoid";
import type {
  SceneNode,
  StoryState,
  NodeData,
} from "../types";

// Local helper types
type SetState = (
  partial:
    | Partial<StoryState>
    | ((state: StoryState) => Partial<StoryState>),
  replace?: boolean
) => void;

type GetState = () => StoryState & { pushHistory: () => void };

// Utilities
const insertAfter = (arr: string[], id: string, insertAfterId?: string) => {
  if (!insertAfterId) {
    arr.push(id);
    return;
  }
  const idx = arr.indexOf(insertAfterId);
  if (idx >= 0) arr.splice(idx + 1, 0, id);
  else arr.push(id);
};

const deleteRecursively = (story: StoryState["story"], nodeId: string) => {
  const children = story.childrenOrder[nodeId] ?? [];
  for (const childId of children) deleteRecursively(story, childId);
  delete story.nodeMap[nodeId];
  delete story.childrenOrder[nodeId];
};

export const sceneActions = (set: SetState, get: GetState): Partial<StoryState> => ({
  createScene: (parentChapterId, title, insertAfterId, options = {}) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const parent = story.nodeMap[parentChapterId];
    if (!parent || parent.type !== "chapter") return;

    const id = nanoid();
    const newScene: SceneNode = {
      id,
      type: "scene",
      parentId: parentChapterId,
      position: { x: 0, y: 0 },
      title,
      tags: [],
    };

    story.nodeMap[id] = newScene as NodeData;
    story.childrenOrder[id] = [];

    const siblings = story.childrenOrder[parentChapterId] ?? [];
    story.childrenOrder[parentChapterId] = siblings;

    // NEW: allow inserting at the start when requested
    if (options.atStart) {
      siblings.unshift(id);
    } else {
      insertAfter(siblings, id, insertAfterId);
    }

    set({ story });
  },

  updateScene: (id: string, updates: Partial<SceneNode>) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "scene") return;

    story.nodeMap[id] = { ...node, ...updates } as SceneNode;
    set({ story });
  },

  deleteScene: (id: string) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "scene") return;

    const parentId = node.parentId;
    if (parentId) {
      const siblings = story.childrenOrder[parentId] ?? [];
      story.childrenOrder[parentId] = siblings.filter((cid: string) => cid !== id);
    }

    deleteRecursively(story, id);
    set({ story });
  },
});
