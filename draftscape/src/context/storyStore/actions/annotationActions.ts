// src/context/storyStore/actions/annotationActions.ts
import { nanoid } from "nanoid";
import type { AnnotationNode, StoryState, NodeData } from "../types";

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

export const annotationActions = (set: SetState, get: GetState): Partial<StoryState> => ({
  createAnnotation: (parentId: string, insertAfterId?: string) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const parent = story.nodeMap[parentId];
    if (!parent) return;

    const id = nanoid();
    const newNode: AnnotationNode = {
      id,
      type: "annotation",
      parentId,
      position: { x: parent.position.x + 165, y: parent.position.y - 15 },
      text: "",
      tags: [],
    };

    story.nodeMap[id] = newNode as NodeData;
    story.childrenOrder[id] = [];

    const siblings = story.childrenOrder[parentId] ?? [];
    story.childrenOrder[parentId] = siblings;
    insertAfter(siblings, id, insertAfterId);

    set({ story });
  },

  updateAnnotation: (id: string, updates: Partial<AnnotationNode>) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "annotation") return;
    story.nodeMap[id] = { ...node, ...updates } as AnnotationNode;
    set({ story });
  },

  deleteAnnotation: (id: string) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "annotation") return;

    const parentId = node.parentId;
    if (parentId) {
      story.childrenOrder[parentId] =
        story.childrenOrder[parentId]?.filter((cid) => cid !== id) || [];
    }

    deleteRecursively(story, id);
    set({ story });
  },
});
