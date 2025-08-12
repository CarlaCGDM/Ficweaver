// src/context/storyStore/actions/textActions.ts
import { nanoid } from "nanoid";
import type {
  TextNode,
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

export const textActions = (set: SetState, get: GetState): Partial<StoryState> => ({
  createText: (parentId: string, insertAfterId?: string, options: { atStart?: boolean } = {}) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const parent = story.nodeMap[parentId];
    if (!parent) return;

    const id = nanoid();
    const newText: TextNode = {
      id,
      type: "text",
      parentId,
      position: { x: 0, y: 0 },
      text: "",
      images: [],
      tags: [],
    };

    story.nodeMap[id] = newText as NodeData;
    story.childrenOrder[id] = [];

    const siblings = story.childrenOrder[parentId] ?? [];
    story.childrenOrder[parentId] = siblings;

    // NEW: allow inserting at the start of the parent
    if (options.atStart) {
      siblings.unshift(id);
    } else {
      insertAfter(siblings, id, insertAfterId);
    }

    set({ story });
  },

  updateText: (id: string, updates: Partial<TextNode>) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "text") return;

    story.nodeMap[id] = { ...node, ...updates } as TextNode;
    set({ story });
  },

  deleteText: (id: string) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "text") return;

    const parentId = node.parentId;
    if (parentId) {
      const siblings = story.childrenOrder[parentId] ?? [];
      story.childrenOrder[parentId] = siblings.filter((cid: string) => cid !== id);
    }

    deleteRecursively(story, id);
    set({ story });
  },
});
