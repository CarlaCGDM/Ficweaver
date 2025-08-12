// src/context/storyStore/actions/pictureActions.ts
import { nanoid } from "nanoid";
import type { PictureNode, StoryState, NodeData } from "../types";

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

export const pictureActions = (set: SetState, get: GetState): Partial<StoryState> => ({
   createPicture: (parentId, insertAfterId) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const parent = story.nodeMap[parentId];
    if (!parent) return;

    const id = nanoid();
    const newNode: PictureNode = {
      id,
      type: "picture",
      parentId,
      position: { x: parent.position.x + 195, y: parent.position.y - 75 },   // ⬅️ same position as parent
      description: "",
      tags: [],
    };

    story.nodeMap[id] = newNode as NodeData;
    story.childrenOrder[id] = [];

    const siblings = story.childrenOrder[parentId] ?? [];
    story.childrenOrder[parentId] = siblings;
    // media are unordered visually; appending is fine
    const idx = insertAfterId ? siblings.indexOf(insertAfterId) : -1;
    if (idx >= 0) siblings.splice(idx + 1, 0, id);
    else siblings.push(id);

    set({ story });
  },

  updatePicture: (id: string, updates: Partial<PictureNode>) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "picture") return;
    story.nodeMap[id] = { ...node, ...updates } as PictureNode;
    set({ story });
  },

  deletePicture: (id: string) => {
    get().pushHistory();
    const story = structuredClone(get().story);
    const node = story.nodeMap[id];
    if (!node || node.type !== "picture") return;

    const parentId = node.parentId;
    if (parentId) {
      story.childrenOrder[parentId] =
        story.childrenOrder[parentId]?.filter((cid) => cid !== id) || [];
    }

    deleteRecursively(story, id);
    set({ story });
  },
});
