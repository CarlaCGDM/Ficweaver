// src/components/OutlinePanel/utils/outlineHelpers.ts
import type { Story, NodeData, ChapterNode } from "../../../../context/storyStore/types";

export interface OutlineOpenState {
  openChapters: Record<string, boolean>;
  openScenes: Record<string, boolean>;
}

/**
 * Given a focused nodeId, determines which chapter(s) and scene(s)
 * should be expanded in the outline.
 */
export function getOpenStatesFromFocus(
  story: Story,
  focusedNodeId: string
): OutlineOpenState {
  const openChapters: Record<string, boolean> = {};
  const openScenes: Record<string, boolean> = {};

  if (!focusedNodeId || !story.nodeMap[focusedNodeId]) {
    return { openChapters, openScenes };
  }

  let currentId: string | null = focusedNodeId;
  while (currentId) {
    const node: NodeData | undefined = story.nodeMap[currentId];
    if (!node) break;
    const parentId: string | null = node.parentId ?? null;

    if (node.type === "scene") {
      openScenes[node.id] = true;
    }
    if (node.type === "chapter") {
      openChapters[node.id] = true;
    }

    currentId = parentId;
  }

  return { openChapters, openScenes };
}


/**
 * Returns an array of top-level chapters in order.
 */
export function getChaptersInOrder(story: Story): ChapterNode[] {
  return story.order
    .map((id) => story.nodeMap[id])
    .filter((n): n is ChapterNode => !!n && n.type === "chapter");
}
