// src/components/Canvas/Node/NodeActions/visibility.ts
import type { Story, NodeData } from "../../../../context/storyStore/types";
import { lastTextIdInScene, lastSceneIdInChapter } from "./hierarchy";

export function canShowNewText(node: NodeData): boolean {
  return node.type === "scene" || node.type === "text";
}

export function canShowNewScene(story: Story, node: NodeData): boolean {
  if (node.type === "chapter" || node.type === "scene") return true;
  if (node.type !== "text") return false;

  const sceneId = node.parentId ?? null;
  if (!sceneId) return false;

  // Only allow if this text is the last text in its scene
  return lastTextIdInScene(story, sceneId) === node.id;
}

export function canShowNewChapter(_story: Story, node: NodeData): boolean {
  // 👇 Only allow from chapter nodes now
  return node.type === "chapter";
}
