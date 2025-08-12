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
const insertAfter = (arr: string[], id: string, afterId?: string | null) => {
  if (!afterId) { arr.push(id); return; }
  const idx = arr.indexOf(afterId);
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
  moveNode: (nodeId, newParentId, insertAfterId = null, options = {}) => {
    const { story, pushHistory } = get();
    const s = structuredClone(story);
    const node = s.nodeMap[nodeId];
    if (!node) return;

    pushHistory?.();

    // 1) Detach from previous location
    const oldParentId = node.parentId;
    if (oldParentId === null) {
      s.order = s.order.filter((id) => id !== nodeId);
    } else {
      const sibs = s.childrenOrder[oldParentId] ?? [];
      s.childrenOrder[oldParentId] = sibs.filter((id) => id !== nodeId);
    }

    // 2) Set new parent
    node.parentId = newParentId;
    s.nodeMap[nodeId] = node;

    // 3) Insert at the new location
    if (newParentId === null) {
      // top-level chapters
      const top = [...s.order];
      if (options.atStart) {
        top.unshift(nodeId);                 // ⬅️ honor atStart
      } else {
        insertAfter(top, nodeId, insertAfterId);
      }
      s.order = top;
    } else {
      const siblings = s.childrenOrder[newParentId] ?? [];
      s.childrenOrder[newParentId] = siblings;
      if (options.atStart) {
        siblings.unshift(nodeId);            // ⬅️ honor atStart
      } else {
        insertAfter(siblings, nodeId, insertAfterId);
      }
    }

    set({ story: s });
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
