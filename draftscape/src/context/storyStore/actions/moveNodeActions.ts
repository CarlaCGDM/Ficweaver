// src/context/storyStore/actions/moveNodeActions.ts
import type { StoryState, NodeData } from "../types";

// Local helper types (avoid implicit any)
type SetState = (
  partial:
    | Partial<StoryState>
    | ((state: StoryState) => Partial<StoryState>),
  replace?: boolean
) => void;

type GetState = () => StoryState & { pushHistory: () => void };

// -----------------------------
// Utilities
// -----------------------------
const insertAfter = (arr: string[], id: string, insertAfterId?: string | null) => {
  if (!insertAfterId) {
    arr.push(id);
    return;
  }
  const idx = arr.indexOf(insertAfterId);
  if (idx >= 0) arr.splice(idx + 1, 0, id);
  else arr.push(id);
};

const removeFromArray = (arr: string[] | undefined, id: string) => {
  if (!arr) return;
  const idx = arr.indexOf(id);
  if (idx >= 0) arr.splice(idx, 1);
};

const isDescendant = (story: StoryState["story"], ancestorId: string, nodeId: string): boolean => {
  // true if nodeId is within ancestorId's subtree
  const stack = [...(story.childrenOrder[ancestorId] ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === nodeId) return true;
    const kids = story.childrenOrder[cur] ?? [];
    for (let i = 0; i < kids.length; i++) stack.push(kids[i]);
  }
  return false;
};

// Allowed parent mapping for each child type
const isValidParent = (
  childType: NodeData["type"],
  parentType: NodeData["type"] | null
): boolean => {
  switch (childType) {
    case "chapter":
      // Chapters can only be top-level
      return parentType === null;
    case "scene":
      return parentType === "chapter";
    case "text":
      return parentType === "scene";
    case "picture":
    case "annotation":
    case "event":
      // Media can attach to chapter, scene, or text
      return parentType === "chapter" || parentType === "scene" || parentType === "text";
    default:
      return false;
  }
};

// -----------------------------
// Slice
// -----------------------------
export const moveNodeActions = (set: SetState, get: GetState): Partial<StoryState> => ({
  /**
   * Move (re-parent) a node to a new parent & position in the sibling list.
   * - newParentId = null → top-level (only for chapters)
   * - insertAfterId places the node after a specific sibling under the new parent
   */
  moveNode: (nodeId: string, newParentId: string | null, insertAfterId?: string | null) => {
    get().pushHistory();

    const story = structuredClone(get().story);
    const node = story.nodeMap[nodeId];
    if (!node) {
      console.warn("[moveNode] node not found:", nodeId);
      return;
    }

    const oldParentId = node.parentId;
    const oldParentType: NodeData["type"] | null =
      oldParentId ? story.nodeMap[oldParentId]?.type ?? null : null;

    const newParentType: NodeData["type"] | null =
      newParentId ? story.nodeMap[newParentId]?.type ?? null : null;

    // Validate new parent existence/type (null means top-level)
    if (newParentId && !story.nodeMap[newParentId]) {
      console.warn("[moveNode] newParent not found:", newParentId);
      return;
    }

    // Prevent cycles: cannot move a node under its own descendant
    if (newParentId && isDescendant(story, nodeId, newParentId)) {
      console.warn("[moveNode] cannot move a node under its own descendant");
      return;
    }

    // Validate allowed parent/child relationship
    if (!isValidParent(node.type, newParentType)) {
      console.warn(
        `[moveNode] invalid parent type: child ${node.type} → parent ${newParentType ?? "null"}`
      );
      return;
    }

    // If top-level: only chapters allowed
    if (newParentId === null && node.type !== "chapter") {
      console.warn("[moveNode] only chapters can be top-level");
      return;
    }

    // Remove from old parent/order
    if (oldParentId) {
      removeFromArray(story.childrenOrder[oldParentId], nodeId);
    } else {
      // top-level (chapter) previously
      story.order = story.order.filter((cid) => cid !== nodeId);
    }

    // Insert into new parent/order
    if (newParentId) {
      if (!story.childrenOrder[newParentId]) story.childrenOrder[newParentId] = [];
      insertAfter(story.childrenOrder[newParentId], nodeId, insertAfterId ?? undefined);
    } else {
      // top-level
      insertAfter(story.order, nodeId, insertAfterId ?? undefined);
    }

    // Update parentId
    story.nodeMap[nodeId] = { ...node, parentId: newParentId } as NodeData;

    set({ story });
  },

  /**
   * Reorder the top-level chapters with a complete, validated order.
   * (No re-parenting; just ordering)
   */
  reorderChapters: (orderedIds: string[]) => {
    get().pushHistory();

    const story = structuredClone(get().story);

    // Validate: all ids exist, are chapters, and set equality matches current top-level chapters
    const currentTop = story.order.slice().sort();
    const nextTop = orderedIds.slice().sort();
    const sameSet =
      currentTop.length === nextTop.length &&
      currentTop.every((id, i) => id === nextTop[i]);

    if (!sameSet) {
      console.warn("[reorderChapters] the provided set doesn't match existing top-level chapters");
      return;
    }

    // Type check
    for (const id of orderedIds) {
      const n = story.nodeMap[id];
      if (!n || n.type !== "chapter" || n.parentId !== null) {
        console.warn("[reorderChapters] non-chapter or non-top-level id in order:", id);
        return;
      }
    }

    story.order = orderedIds.slice();
    set({ story });
  },
});
