// src/context/storyStore/actions/chapterActions.ts
import { nanoid } from "nanoid";
import type {
  ChapterNode,
  StoryState,
  NodeData,
} from "../types";
import { positionForChapterAfter } from "../positioning";

// Local helper types for Zustand slice creators
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

export const chapterActions = (set: SetState, get: GetState): Partial<StoryState> => ({
  createChapter: (title: string, insertAfterId?: string) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const id = nanoid();

    // compute initial position
    let position = { x: 100, y: 100 };
    if (insertAfterId && story.nodeMap[insertAfterId]?.type === "chapter") {
      position = positionForChapterAfter(story, insertAfterId);
    } else if (!insertAfterId && story.order.length) {
      // if appending without an explicit target, place after the current last chapter
      position = positionForChapterAfter(story, story.order[story.order.length - 1]);
    }

    const newChapter: ChapterNode = {
      id,
      type: "chapter",
      parentId: null,
      position: position,
      title,
      tags: [],
    };

    story.nodeMap[id] = newChapter as NodeData;
    story.childrenOrder[id] = [];
    insertAfter(story.order, id, insertAfterId);

    set({ story });
  },

  updateChapter: (id: string, updates: Partial<ChapterNode>) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "chapter") return;

    story.nodeMap[id] = { ...node, ...updates } as ChapterNode;
    set({ story });
  },

  deleteChapter: (id: string) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "chapter") return;

    // Remove from top-level order
    story.order = story.order.filter((cid: string) => cid !== id);

    // Recursive delete
    deleteRecursively(story, id);

    set({ story });
  },
});
