// src/context/storyStore/helpers.ts
import type { Story, Position, NodeData } from "./types";

/**
 * Returns the position of the "last" node in outline order:
 * - last top-level chapter in `order`
 * - then repeatedly take the last child from `childrenOrder`
 * Fallbacks to { x: 100, y: 100 } if no nodes exist.
 */
export const getLastNodePosition = (story: Story): Position => {
  const { order, nodeMap, childrenOrder } = story;

  const fallback: Position = { x: 100, y: 100 };
  if (!order.length) return fallback;

  // Start from last chapter id
  let currentId = order[order.length - 1];
  if (!nodeMap[currentId]) return fallback;

  // Descend to the deepest last child
  while (true) {
    const children = childrenOrder[currentId] ?? [];
    if (!children.length) break;
    const lastChildId = children[children.length - 1];
    if (!nodeMap[lastChildId]) break;
    currentId = lastChildId;
  }

  const node = nodeMap[currentId];
  return node?.position ?? fallback;
};

/**
 * Collects a group of node IDs that should move together when `nodeId` is dragged.
 * By default, this is the node + ALL of its descendants.
 * This preserves the old behavior (chapter → scenes/text/media; scene → text/media; text → media).
 */
export const collectShiftGroup = (story: Story, nodeId: string): string[] => {
  const { nodeMap, childrenOrder } = story;
  if (!nodeMap[nodeId]) return [nodeId];

  const group: string[] = [];
  const stack: string[] = [nodeId];

  while (stack.length) {
    const id = stack.pop()!;
    if (!nodeMap[id]) continue;

    group.push(id);

    const kids = childrenOrder[id] ?? [];
    // Include all descendants
    for (let i = kids.length - 1; i >= 0; i--) {
      stack.push(kids[i]);
    }
  }

  return group;
};

/**
 * Shifts the positions of all nodes in `nodeIds` by the given offset.
 * Use with `collectShiftGroup` for subtree moves.
 */
export const shiftNodes = (story: Story, nodeIds: string[], offset: Position) => {
  const { nodeMap } = story;

  for (const id of nodeIds) {
    const n = nodeMap[id];
    if (!n) continue;

    nodeMap[id] = {
      ...n,
      position: {
        x: n.position.x + offset.x,
        y: n.position.y + offset.y,
      },
    } as NodeData;
  }
};

/**
 * For canvas dragging: currently the same as collectShiftGroup.
 * Keep it separate in case you want different inclusion rules later.
 */
export const collectCanvasDragGroup = (story: Story, nodeId: string): string[] => {
  return collectShiftGroup(story, nodeId);
};
