// src/components/Canvas/hooks/useCanvasDrag.ts
import { useEffect, useRef } from "react";
import type { Story, NodeData } from "../../../context/storyStore/types";
import { useStoryStore } from "../../../context/storyStore/storyStore";

export function useCanvasDrag(
  story: Story,
  zoomScale: number,
  draggingNodeId: string | null,
  draggingGroup: string[] | null,
  updateNodePosition: (id: string, pos: { x: number; y: number }, isFromDrag?: boolean) => void,
  findNodeById: (id: string) => NodeData | null,
  clearDragState?: () => void
) {
  const historyCapturedRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingNodeId || !draggingGroup) return;
      if (!historyCapturedRef.current) {
        useStoryStore.getState().pushHistory();
        historyCapturedRef.current = true;
      }

      const deltaX = e.movementX / zoomScale;
      const deltaY = e.movementY / zoomScale;

      // batched updates
      const updates: Array<{ id: string; x: number; y: number }> = [];
      for (const id of draggingGroup) {
        const n = findNodeById(id);
        if (!n) continue;
        updates.push({ id, x: n.position.x + deltaX, y: n.position.y + deltaY });
      }
      useStoryStore.getState().updateManyNodePositions(updates, true);
    };

    const handleMouseUp = () => {
      historyCapturedRef.current = false;
      clearDragState?.();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    if (draggingNodeId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [zoomScale, draggingNodeId, draggingGroup, findNodeById, clearDragState]);
}
