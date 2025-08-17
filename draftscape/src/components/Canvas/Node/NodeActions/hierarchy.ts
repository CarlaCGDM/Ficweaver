import type {
  Story,
  NodeData,
  SceneNode,
  ChapterNode,
} from "../../../../context/storyStore/types";

/** Safe node lookup */
export function getNode(
  story: Story,
  id: string | undefined | null
): NodeData | undefined {
  return id ? story.nodeMap[id] : undefined;
}

/** Find the scene that directly owns this node (via childrenOrder) */
export function findParentSceneId(story: Story, id: string): string | null {
  for (const [parentId, kids] of Object.entries(story.childrenOrder)) {
    if (kids?.includes(id) && story.nodeMap[parentId]?.type === "scene") {
      return parentId;
    }
  }
  return null;
}

/** In flat model, scenes usually have parentId = chapterId. Fallback to search if needed. */
export function findParentChapterIdFromScene(story: Story, sceneId: string): string | null {
  const sc = story.nodeMap[sceneId] as SceneNode | undefined;
  if (sc?.type === "scene" && sc.parentId) return sc.parentId;

  for (const chId of story.order) {
    const children = story.childrenOrder[chId] ?? [];
    if (children.includes(sceneId)) return chId;
  }
  return null;
}

/** Last TEXT inside a scene (ignore media) */
export function lastTextIdInScene(story: Story, sceneId: string): string | null {
  const kids = story.childrenOrder[sceneId] ?? [];
  for (let i = kids.length - 1; i >= 0; i--) {
    const n = story.nodeMap[kids[i]];
    if (n?.type === "text") return n.id;
  }
  return null;
}

/** Last SCENE inside a chapter */
export function lastSceneIdInChapter(story: Story, chapterId: string): string | null {
  const kids = story.childrenOrder[chapterId] ?? [];
  const scenes = kids.filter((id) => story.nodeMap[id]?.type === "scene");
  return scenes.length ? scenes[scenes.length - 1] : null;
}
