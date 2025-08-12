// src/context/storyStore/actions/textActions.ts
import { nanoid } from "nanoid";
import type {
  TextNode,
  StoryState,
  NodeData,
} from "../types";
import { positionBelow } from "../positioning";

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

const corners = ["top-left","top-right","bottom-left","bottom-right"] as const;
const randomSticker = (): NonNullable<TextNode["sticker"]> => ({
  imageIndex: Math.floor(Math.random() * 7) + 1, // 1–7
  corner: corners[Math.floor(Math.random() * corners.length)],
});

export const textActions = (set: SetState, get: GetState): Partial<StoryState> => ({
  createText: (parentId: string, insertAfterId?: string, options: { atStart?: boolean } = {}) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const parent = story.nodeMap[parentId];
    if (!parent) return;

    const id = nanoid();

    let refId: string;
    if (options.atStart) refId = parentId;
    else if (insertAfterId) refId = insertAfterId;
    else {
      const sibs = story.childrenOrder[parentId] ?? [];
      refId = sibs.length ? sibs[sibs.length - 1] : parentId;
    }

    const newText: TextNode = {
      id,
      type: "text",
      parentId,
      position: positionBelow(story, refId),
      text: "",
      images: [],
      tags: [],
      sticker: randomSticker(),      // ⬅️ add this
    };

    story.nodeMap[id] = newText;
    story.childrenOrder[id] = [];

    const siblings = story.childrenOrder[parentId] ?? [];
    story.childrenOrder[parentId] = siblings;
    if (options.atStart) siblings.unshift(id);
    else {
      const idx = insertAfterId ? siblings.indexOf(insertAfterId) : -1;
      if (idx >= 0) siblings.splice(idx + 1, 0, id);
      else siblings.push(id);
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
