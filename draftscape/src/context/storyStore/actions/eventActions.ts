// src/context/storyStore/actions/eventActions.ts
import { nanoid } from "nanoid";
import type { EventNode, StoryState, NodeData } from "../types";

type SetState = (
  partial: Partial<StoryState> | ((state: StoryState) => Partial<StoryState>),
  replace?: boolean
) => void;

type GetState = () => StoryState & { pushHistory: () => void };

const insertAfter = (arr: string[], id: string, insertAfterId?: string) => {
  if (!insertAfterId) arr.push(id);
  else {
    const idx = arr.indexOf(insertAfterId);
    if (idx >= 0) arr.splice(idx + 1, 0, id);
    else arr.push(id);
  }
};

const deleteRecursively = (story: StoryState["story"], nodeId: string) => {
  const children = story.childrenOrder[nodeId] ?? [];
  children.forEach((cid) => deleteRecursively(story, cid));
  delete story.nodeMap[nodeId];
  delete story.childrenOrder[nodeId];
};

export const eventActions = (set: SetState, get: GetState): Partial<StoryState> => ({
  createEvent: (parentId: string, insertAfterId?: string) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    if (!story.nodeMap[parentId]) return;

    const id = nanoid();
    const newNode: EventNode = {
      id,
      type: "event",
      parentId,
      position: { x: 0, y: 0 },
      year: new Date().getFullYear(),
      title: "",
      tags: [],
    };

    story.nodeMap[id] = newNode as NodeData;
    story.childrenOrder[id] = [];

    const siblings = story.childrenOrder[parentId] ?? [];
    story.childrenOrder[parentId] = siblings;
    insertAfter(siblings, id, insertAfterId);

    set({ story });
  },

  updateEvent: (id: string, updates: Partial<EventNode>) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "event") return;
    story.nodeMap[id] = { ...node, ...updates } as EventNode;
    set({ story });
  },

  deleteEvent: (id: string) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "event") return;

    const parentId = node.parentId;
    if (parentId) {
      story.childrenOrder[parentId] =
        story.childrenOrder[parentId]?.filter((cid) => cid !== id) || [];
    }

    deleteRecursively(story, id);
    set({ story });
  },
});
