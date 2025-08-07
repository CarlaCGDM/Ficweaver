import { useEffect, useRef } from "react";
import type { Story, NodeData } from "../../../context/storyStore/types";
import { useStoryStore } from "../../../context/storyStore/storyStore";

export function useCanvasDrag(
  story: Story,
  zoomScale: number,
  draggingNodeId: string | null,
  draggingGroup: string[] | null,
  updateNodePosition: (nodeId: string, pos: { x: number; y: number }, isFromDrag?: boolean) => void,
  findNodeById: (id: string) => NodeData | null,
  clearDragState?: () => void
) {
  const historyCapturedRef = useRef(false); // ✅ Track if pre-drag snapshot is taken

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingNodeId || !draggingGroup) return;

      // ✅ Save pre-drag state ONCE
      if (!historyCapturedRef.current) {
        useStoryStore.getState().pushHistory();
        historyCapturedRef.current = true;
      }

      const deltaX = e.movementX / zoomScale;
      const deltaY = e.movementY / zoomScale;

      draggingGroup.forEach((nodeId) => {
        const node = findNodeById(nodeId);
        if (node) {
          updateNodePosition(
            nodeId,
            { x: node.position.x + deltaX, y: node.position.y + deltaY },
            true // ✅ Prevent extra history saves
          );
        }
      });
    };

    const handleMouseUp = () => {
      // ✅ Reset tracking (no post-drag save)
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
  }, [zoomScale, draggingNodeId, draggingGroup, updateNodePosition, findNodeById, clearDragState]);
}
