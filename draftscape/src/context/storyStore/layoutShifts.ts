// src/context/storyStore/layoutShifts.ts
import type { Story } from "./types";

/** Find the parent scene of a node (if any). */
export function findParentSceneId(story: Story, nodeId: string): string | null {
  for (const [parentId, childIds] of Object.entries(story.childrenOrder)) {
    if (childIds?.includes(nodeId)) {
      const parent = story.nodeMap[parentId];
      if (parent && parent.type === "scene") return parentId;
    }
  }
  return null;
}

/** Find the chapter that owns a scene. */
export function findChapterOfScene(story: Story, sceneId: string): string | null {
  for (const chId of story.order) {
    const kids = story.childrenOrder[chId] ?? [];
    if (kids.includes(sceneId)) return chId;
  }
  return null;
}

/** Depth-first shift of a node AND all its descendants by dy. */
export function shiftSubtree(story: Story, rootId: string, dy: number, dx: number = 0): void {
  const { nodeMap, childrenOrder } = story;
  const stack: string[] = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    const n = nodeMap[id];
    if (!n) continue;
    nodeMap[id] = {
      ...n,
      position: { x: n.position.x + dx, y: n.position.y + dy },
    } as typeof n;
    const kids = childrenOrder[id] ?? [];
    for (let i = 0; i < kids.length; i++) stack.push(kids[i]);
  }
}

/**
 * Apply a vertical delta caused by a TEXT node height change/insert.
 * - Shifts later siblings inside the SAME scene (node + all descendants).
 * - Shifts all subsequent scenes in the SAME chapter (scene node + all descendants).
 */
export function applyTextDeltaWithinChapter(story: Story, textId: string, deltaY: number): void {
  if (deltaY === 0) return;

  const sceneId = findParentSceneId(story, textId);
  if (!sceneId) return;

  const chapterId = findChapterOfScene(story, sceneId);
  if (!chapterId) return;

  // 1) Later siblings within the same scene:
  //    ✅ shift only TEXT nodes (and their descendants),
  //    ⛔ DO NOT move scene-level media here.
  const siblings = story.childrenOrder[sceneId] ?? [];
  const idx = siblings.indexOf(textId);
  if (idx >= 0) {
    for (let i = idx + 1; i < siblings.length; i++) {
      const sibId = siblings[i];
      const sib = story.nodeMap[sibId];
      if (!sib) continue;

      if (sib.type === "text") {
        // Move the text node + all its descendants (covers media parented to that text)
        shiftSubtree(story, sibId, deltaY);
      }
      // If it's scene-level media, skip it on text-insert.
    }
  }

  // 2) Subsequent scenes in the same chapter (move scene node + entire subtree)
  const sceneIds = (story.childrenOrder[chapterId] ?? []).filter(
    (id) => story.nodeMap[id]?.type === "scene"
  );
  const sIdx = sceneIds.indexOf(sceneId);
  if (sIdx >= 0) {
    for (let i = sIdx + 1; i < sceneIds.length; i++) {
      shiftSubtree(story, sceneIds[i], deltaY);
    }
  }
}


/**
 * (Optional, for scene edits/inserts later)
 * Apply a vertical delta caused by a SCENE node change/insert.
 * Shifts subsequent scenes (scene node + descendants) within the same chapter.
 */
export function applySceneDeltaWithinChapter(story: Story, sceneId: string, deltaY: number): void {
  if (deltaY === 0) return;

  const chapterId = findChapterOfScene(story, sceneId);
  if (!chapterId) return;

  // 1) Move THIS scene’s own children down/up by delta
  //    (don’t move the scene node itself)
  const ownChildren = story.childrenOrder[sceneId] ?? [];
  for (const cid of ownChildren) {
    shiftSubtree(story, cid, deltaY); // moves child + all of its descendants (e.g., media under text)
  }

  // 2) Move all subsequent scenes in the same chapter (and their descendants)
  const sceneIds = (story.childrenOrder[chapterId] ?? [])
    .filter((id) => story.nodeMap[id]?.type === "scene");

  const sIdx = sceneIds.indexOf(sceneId);
  if (sIdx >= 0) {
    for (let i = sIdx + 1; i < sceneIds.length; i++) {
      shiftSubtree(story, sceneIds[i], deltaY);
    }
  }
}

// Shift all *children* of a chapter vertically by deltaY.
// (Does NOT move the chapter node itself or later chapters.)
export function applyChapterDelta(story: Story, chapterId: string, deltaY: number): void {
  if (deltaY === 0) return;
  const childIds = story.childrenOrder[chapterId] ?? [];
  for (const cid of childIds) {
    shiftSubtree(story, cid, deltaY); // moves child + all descendants (scenes → texts → media)
  }
}

// --- Insert gaps (tweak if your real spacing differs)
export const INSERT_GAP_TEXT_Y = 300;
export const INSERT_GAP_SCENE_Y = 300;
export const INSERT_GAP_CHAPTER_X = 1600;

// Reuse your existing delta shifters for inserts
export function applyTextInsertGap(story: Story, newTextId: string, gapY = INSERT_GAP_TEXT_Y) {
  applyTextDeltaWithinChapter(story, newTextId, gapY);
}

export function applySceneInsertGap(story: Story, newSceneId: string, gapY = INSERT_GAP_SCENE_Y) {
  applySceneDeltaWithinChapter(story, newSceneId, gapY);
}

// Shift *subsequent* chapters horizontally by +deltaX
export function applyChapterInsertGapX(story: Story, newChapterId: string, deltaX = INSERT_GAP_CHAPTER_X) {
  const idx = story.order.indexOf(newChapterId);
  if (idx < 0) return;
  const after = story.order.slice(idx + 1);
  for (const chId of after) {
    shiftSubtree(story, chId, 0 /*deltaY*/, deltaX /*deltaX*/);
  }
}

// Put the new chapter BESIDE the previous chapter (same Y, +gapX on X).
export function alignChapterBesidePrevious(
  story: Story,
  newChapterId: string,
  gapX = INSERT_GAP_CHAPTER_X
) {
  const order = story.order;
  const i = order.indexOf(newChapterId);
  if (i < 0) return;
  const prevId = order[i - 1];
  if (!prevId) return;

  const prev = story.nodeMap[prevId];
  const cur = story.nodeMap[newChapterId];
  if (!prev || prev.type !== "chapter" || !cur || cur.type !== "chapter") return;

  story.nodeMap[newChapterId] = {
    ...cur,
    position: { x: prev.position.x + gapX, y: prev.position.y },
  };
}