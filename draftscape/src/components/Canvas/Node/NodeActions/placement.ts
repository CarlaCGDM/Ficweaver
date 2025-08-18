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

/** Place `targetId` directly under `anchorId`. No extra padding. Optionally align X. */
export function placeBelowFlush(
  story: Story,
  targetId: string,
  anchorId: string,
  alignXFromId?: string
) {
  const measured = useNodeMetricsStore.getState().getHeight(anchorId);
  const target = story.nodeMap[targetId];
  const anchor = story.nodeMap[anchorId];
  if (!target || !anchor || measured == null) {
    console.warn("[placeBelowFlush] Missing node or measured height", {
      targetId,
      anchorId,
      target,
      anchor,
      measured,
    });
    return;
  }

  const alignedX =
    (alignXFromId ? story.nodeMap[alignXFromId]?.position.x : undefined) ??
    target.position.x;

  const finalY = anchor.position.y + measured + 300;

  story.nodeMap[targetId] = {
    ...target,
    position: { x: alignedX, y: finalY },
  } as any;

  console.log("[placeBelowFlush] placing below", anchorId, "→", targetId, {
    anchorY: anchor.position.y,
    measured,
    finalY,
  });
}
