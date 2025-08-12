// src/context/storyStore/actions/genericNodeActions.ts
import type { StateCreator } from "zustand";
import type { StoryState } from "../types";
import type { NodeData } from "../types";

type Slice = {
  updateNodePosition: (nodeId: string, pos: { x: number; y: number }, isFromDrag?: boolean) => void;
  updateManyNodePositions: (updates: Array<{ id: string; x: number; y: number }>, isFromDrag?: boolean) => void;
  updateNode: (nodeId: string, updates: Partial<NodeData>) => void;
};

export const genericNodeActions = (
  set: Parameters<StateCreator<any>>[0],
  get: Parameters<StateCreator<any>>[1]
): Slice => ({
  updateNodePosition: (nodeId, pos, isFromDrag = false) => {
    const { story, pushHistory } = get();
    const node = story.nodeMap[nodeId];
    if (!node) return;

    if (!isFromDrag) pushHistory?.();

    set({
      story: {
        ...story,
        nodeMap: {
          ...story.nodeMap,
          [nodeId]: { ...node, position: { x: pos.x, y: pos.y } },
        },
      },
    });
  },

  updateManyNodePositions: (updates, isFromDrag = true) => {
    const { story, pushHistory } = get();
    if (!isFromDrag) pushHistory?.();

    const nextMap = { ...story.nodeMap };
    for (const { id, x, y } of updates) {
      const n = nextMap[id];
      if (n) nextMap[id] = { ...n, position: { x, y } };
    }
    set({ story: { ...story, nodeMap: nextMap } });
  },

  updateNode: (nodeId, updates) => {
    const { story, pushHistory } = get();
    const node = story.nodeMap[nodeId];
    if (!node) return;
    pushHistory?.();
    set({
      story: {
        ...story,
        nodeMap: { ...story.nodeMap, [nodeId]: { ...node, ...updates } },
      },
    });
  },
});
