import Node from "./Node/Node";
import { useRef, useState, useCallback, useEffect } from "react";
import type { Story, NodeData } from "../../context/storyStore/types";
import { collectCanvasDragGroup } from "../../context/storyStore/helpers";
import { useStoryStore } from "../../context/storyStore/storyStore";
import React from "react";

interface CanvasNodesProps {
  story: Story;
  draggingNodeId: string | null;
  draggingGroup: string[] | null;
  setDraggingNodeId: (id: string | null) => void;
  setDraggingGroup: (group: string[] | null) => void;
  onEditNode: (node: NodeData) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  focusedNodeId?: string;
}

export default function CanvasNodes({
  story,
  draggingNodeId,
  draggingGroup,
  setDraggingNodeId,
  setDraggingGroup,
  onEditNode,
  onNodeDoubleClick,
  focusedNodeId,
}: CanvasNodesProps) {
  const lastClickTimeRef = useRef<number>(0);
  const mouseDownInfoRef = useRef<{
    nodeId: string;
    startPos: { x: number; y: number };
    timestamp: number;
  } | null>(null);
  const isDraggingRef = useRef(false);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseDownInfoRef.current || isDraggingRef.current) return;

    const { startPos, nodeId } = mouseDownInfoRef.current;
    const distance = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y);

    if (distance > 5) {
      isDraggingRef.current = true;
      setDraggingNodeId(nodeId);
      setDraggingGroup(collectCanvasDragGroup(useStoryStore.getState().story, nodeId));
    }
  }, [setDraggingNodeId, setDraggingGroup]);

  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    if (!mouseDownInfoRef.current) return;

    const { nodeId, startPos } = mouseDownInfoRef.current;
    const distance = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y);
    const now = Date.now();

    mouseDownInfoRef.current = null;
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);

    if (!isDraggingRef.current && distance <= 5) {
      const timeSinceLastClick = now - lastClickTimeRef.current;
      if (timeSinceLastClick < 300) {
        onNodeDoubleClick(nodeId);
        lastClickTimeRef.current = 0;
      } else {
        lastClickTimeRef.current = now;
      }
    }

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  }, [handleGlobalMouseMove, onNodeDoubleClick]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button, input, textarea, select, [contenteditable]');
    if (isInteractive) return;

    e.stopPropagation();
    e.preventDefault();

    mouseDownInfoRef.current = {
      nodeId,
      startPos: { x: e.clientX, y: e.clientY },
      timestamp: Date.now()
    };

    isDraggingRef.current = false;
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  return (
    <div style={{ transform: "translate(1000px, 1000px)" }}>
      {story.chapters.map((ch, chapterIndex) => {
        // ✅ Prefer index if present, otherwise legacy string
        const chapterColorToken: number | string =
          (ch as any).colorIndex ?? ch.color ?? 0;

        return (
          <div key={ch.id}>
            <Node
              node={ch.chapterNode}
              parentChapterId={ch.id}
              chapterColor={chapterColorToken}   // ✅ pass the token
              isDragging={draggingNodeId === ch.chapterNode.id}
              isInDragGroup={draggingGroup?.includes(ch.chapterNode.id) || false}
              onMouseDown={(e) => handleMouseDown(e, ch.chapterNode.id)}
              onMouseUp={() => {}}
              onDoubleClick={() => {}}
              onEditNode={onEditNode}
              chapterIndex={chapterIndex}
              focusedNodeId={focusedNodeId}
            />

            {ch.scenes.map((sc, sceneIndex) => {
              const sceneColorToken: number | string =
                (sc as any).colorIndex ?? sc.color ?? chapterColorToken; // ✅ fall back to chapter

              return sc.nodes.map((n) => (
                <Node
                  key={n.id}
                  node={n}
                  parentChapterId={ch.id}
                  parentSceneId={sc.id}
                  chapterColor={chapterColorToken} // ✅ consistent
                  sceneColor={sceneColorToken}     // ✅ consistent
                  isDragging={draggingNodeId === n.id}
                  isInDragGroup={draggingGroup?.includes(n.id) || false}
                  onMouseDown={(e) => handleMouseDown(e, n.id)}
                  onMouseUp={() => {}}
                  onDoubleClick={() => {}}
                  onEditNode={onEditNode}
                  chapterIndex={chapterIndex}
                  sceneIndex={sceneIndex}
                  focusedNodeId={focusedNodeId}
                />
              ));
            })}
          </div>
        );
      })}
    </div>
  );
}
