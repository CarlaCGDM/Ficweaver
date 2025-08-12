import type { Story, NodeData, NodeType } from "./types";
import { useNodeMetricsStore } from "../uiStore/nodeMetricsStore";

const DEFAULT_HEIGHTS: Record<NodeType, number> = {
  chapter: 120,
  scene: 120,
  text: 160,
  picture: 140,
  annotation: 120,
  event: 120,
};

const FALLBACK_POS = { x: 100, y: 100 };
const BUFFER_Y = 200;
const CHAPTER_X_OFFSET = 1500;

const heightOf = (story: Story, id: string): number => {
  const n = story.nodeMap[id] as NodeData | undefined;
  if (!n) return DEFAULT_HEIGHTS.text;
  const measured = useNodeMetricsStore.getState().getHeight(id);
  return measured ?? DEFAULT_HEIGHTS[n.type];
};

/** deepest last descendant id under startId (returns startId if no children) */
export const deepestLastId = (story: Story, startId: string): string => {
  let current = startId;
  while (true) {
    const kids = story.childrenOrder[current] ?? [];
    if (!kids.length) break;
    current = kids[kids.length - 1];
  }
  return current;
};

/** For new chapter after prevChapterId: right of the previous chapter’s tail node */
export const positionForChapterAfter = (story: Story, prevChapterId: string) => {
  const tailId = deepestLastId(story, prevChapterId);
  const tail = story.nodeMap[tailId];
  const base = tail?.position ?? FALLBACK_POS;
  return { x: base.x + CHAPTER_X_OFFSET, y: base.y };
};

/** Stack a node below another: vertical = half(above.height) + buffer; same X */
export const positionBelow = (story: Story, aboveId: string) => {
  const above = story.nodeMap[aboveId];
  if (!above) return { ...FALLBACK_POS, y: FALLBACK_POS.y + BUFFER_Y };
  const h = heightOf(story, aboveId);
  return { x: above.position.x, y: above.position.y + Math.round(h / 2) + BUFFER_Y };
};
