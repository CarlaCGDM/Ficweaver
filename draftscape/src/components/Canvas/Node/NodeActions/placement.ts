import type { Story } from "../../../../context/storyStore/types";
import { useNodeMetricsStore } from "../../../../context/uiStore/nodeMetricsStore";

/** Shallow clone story for safe in-place edits */
export function cloneStory(st: Story): Story {
  return {
    title: st.title,
    nodeMap: { ...st.nodeMap },
    order: [...st.order],
    childrenOrder: Object.fromEntries(
      Object.entries(st.childrenOrder).map(([k, v]) => [k, [...(v ?? [])]])
    ),
  };
}

/** Find the new node id created between two snapshots */
export function findNewId(before: Story, after: Story): string | null {
  const prev = new Set(Object.keys(before.nodeMap));
  for (const id of Object.keys(after.nodeMap)) {
    if (!prev.has(id)) return id;
  }
  return null;
}

/** Read measured height from the metrics store (no hooks used) */
export function getMeasuredHeight(nodeId: string): number | null {
  const { nodeSizes } = useNodeMetricsStore.getState() as any;
  const h = nodeSizes?.[nodeId]?.height;
  return typeof h === "number" ? h : null;
}

/** Bottom = y + measuredHeight (fallback 0 if unknown) */
export function getBottomY(story: Story, nodeId: string): number {
  const n = story.nodeMap[nodeId];
  if (!n) return 0;
  const h = getMeasuredHeight(nodeId) ?? 0;
  return n.position.y + h;
}

/** Place `targetId` directly under `anchorId`. No extra padding. Optionally align X. */
export function placeBelowFlush(
  story: Story,
  targetId: string,
  anchorId: string,
  alignXFromId?: string
) {
  const target = story.nodeMap[targetId];
  if (!target) return;

  const anchorBottom = getBottomY(story, anchorId);
  const alignedX =
    (alignXFromId ? story.nodeMap[alignXFromId]?.position.x : undefined) ??
    target.position.x;

  story.nodeMap[targetId] = {
    ...target,
    position: { x: alignedX, y: anchorBottom },
  } as any;
}
