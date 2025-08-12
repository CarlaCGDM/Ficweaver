import { create } from "zustand";
import type { Story, NodeData } from "../storyStore/types";
import { useStoryStore } from "../storyStore/storyStore";
import { collectShiftGroup } from "../storyStore/helpers";

type MoveSpec = {
  newParentId: string | null;
  insertAfterId?: string | null;
  options?: { atStart?: boolean };
};

type ConnectState = {
  isConnecting: boolean;
  sourceId: string | null;
  // Which ids are clickable + how to place if clicked
  targets: Record<string, MoveSpec>;
  startConnect: (sourceId: string, targets: Record<string, MoveSpec>) => void;
  cancelConnect: () => void;
  tryComplete: (targetId: string) => void;
};

// Build safe exclusions (no cycles, no self)
const excludedIds = (story: Story, sourceId: string) => new Set(collectShiftGroup(story, sourceId));

// The brain: compute placement rules per target id
export function computeTargets(story: Story, sourceId: string): Record<string, MoveSpec> {
  const src = story.nodeMap[sourceId];
  if (!src) return {};
  const exclude = excludedIds(story, sourceId);

  const out: Record<string, MoveSpec> = {};
  const put = (targetId: string, spec: MoveSpec) => { out[targetId] = spec; };

  const nodes = Object.values(story.nodeMap).filter(n => !exclude.has(n.id));

  switch (src.type) {
    case "chapter": {
      // Click a chapter -> insert AFTER that chapter at top level
      nodes.forEach(n => {
        if (n.type === "chapter") put(n.id, { newParentId: null, insertAfterId: n.id });
      });
      break;
    }

    case "scene": {
      // Click a chapter -> become FIRST scene of that chapter
      nodes.forEach(n => {
        if (n.type === "chapter") put(n.id, { newParentId: n.id, options: { atStart: true } });
      });
      // Click a scene -> move AFTER that scene (into its chapter)
      nodes.forEach(n => {
        if (n.type === "scene") {
          const parentChapterId = n.parentId; // scenes parent chapters
          if (parentChapterId) {
            put(n.id, { newParentId: parentChapterId, insertAfterId: n.id });
          }
        }
      });
      break;
    }

    case "text": {
      // Click a scene -> become FIRST text of that scene
      nodes.forEach(n => {
        if (n.type === "scene") put(n.id, { newParentId: n.id, options: { atStart: true } });
      });
      // Click a text -> move AFTER that text (into its scene)
      nodes.forEach(n => {
        if (n.type === "text") {
          const parentSceneId = n.parentId;
          if (parentSceneId) put(n.id, { newParentId: parentSceneId, insertAfterId: n.id });
        }
      });
      break;
    }

    case "picture":
    case "annotation":
    case "event": {
      // Media: click Chapter/Scene/Text -> just change parent (unordered)
      nodes.forEach(n => {
        if (n.type === "chapter" || n.type === "scene" || n.type === "text") {
          put(n.id, { newParentId: n.id });
        }
      });
      break;
    }
  }

  // Remove noop target (e.g., clicking the same chapter for “insert after itself”)
  delete out[sourceId];
  return out;
}

export const useConnectStore = create<ConnectState>((set, get) => ({
  isConnecting: false,
  sourceId: null,
  targets: {},
  startConnect: (sourceId, targets) => set({ isConnecting: true, sourceId, targets }),
  cancelConnect: () => set({ isConnecting: false, sourceId: null, targets: {} }),
  tryComplete: (targetId) => {
    const { isConnecting, sourceId, targets } = get();
    if (!isConnecting || !sourceId) return;
    const spec = targets[targetId];
    if (!spec) return;

    const store = useStoryStore.getState();
    const src = store.story.nodeMap[sourceId];
    const tgt = store.story.nodeMap[targetId];
    if (!src || !tgt) return;

    // Friendly confirm
    const label = (() => {
      const name = (x: NodeData) => x.title ?? (x as any).description ?? x.type;
      switch (src.type) {
        case "chapter": return `Insert chapter "${name(src)}" after "${name(tgt)}"?`;
        case "scene":   return tgt.type === "chapter"
          ? `Move scene "${name(src)}" to the start of chapter "${name(tgt)}"?`
          : `Insert scene "${name(src)}" after scene "${name(tgt)}"?`;
        case "text":    return tgt.type === "scene"
          ? `Move text to the start of scene "${name(tgt)}"?`
          : `Insert text after "${name(tgt)}"?`;
        default:        return `Change parent of ${src.type} to "${name(tgt)}"?`;
      }
    })();

    if (!window.confirm(label)) return;

    // Do it
    store.moveNode(sourceId, spec.newParentId, spec.insertAfterId ?? null, spec.options);

    // Exit
    get().cancelConnect();
  },
}));
