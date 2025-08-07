import Node from "./Node/Node";
import { useRef, useState, useCallback } from "react";
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

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseDownInfoRef.current || isDraggingRef.current) return;

    const { startPos, nodeId } = mouseDownInfoRef.current;
    const distance = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y);

    if (distance > 5) {
      console.log("🎯 Drag started for", nodeId);
      isDraggingRef.current = true;
      setDraggingNodeId(nodeId);
      setDraggingGroup(collectCanvasDragGroup(useStoryStore.getState().story, nodeId));
    }
  }, [setDraggingNodeId, setDraggingGroup]);

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    if (!mouseDownInfoRef.current) return;

    const { nodeId, startPos, timestamp } = mouseDownInfoRef.current;
    const distance = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y);
    const now = Date.now();

    // Clean up
    mouseDownInfoRef.current = null;
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);

    // If we didn't drag and it was a quick click, check for double-click
    if (!isDraggingRef.current && distance <= 5) {
      const timeSinceLastClick = now - lastClickTimeRef.current;

      if (timeSinceLastClick < 300) { // Double-click window
        console.log("🔥 Double-click detected for", nodeId);
        onNodeDoubleClick(nodeId);
        lastClickTimeRef.current = 0; // Reset to prevent triple-click
      } else {
        lastClickTimeRef.current = now;
      }
    }

    // Reset drag state
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  }, [handleGlobalMouseMove, onNodeDoubleClick]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return; // Only left mouse button

    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button, input, textarea, select, [contenteditable]');

    if (isInteractive) {
      // Don't interfere with interactive elements at all
      return;
    }

    e.stopPropagation();
    e.preventDefault(); // Prevent text selection

    // Store mouse down info
    mouseDownInfoRef.current = {
      nodeId,
      startPos: { x: e.clientX, y: e.clientY },
      timestamp: Date.now()
    };

    isDraggingRef.current = false;

    // Add global listeners
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  return (
    <div style={{ transform: "translate(1000px, 1000px)" }}>
      {story.chapters.map((ch, chapterIndex) => (
        <div key={ch.id}>
          <Node
            node={ch.chapterNode}
            parentChapterId={ch.id}
            chapterColor={ch.color}
            isDragging={draggingNodeId === ch.chapterNode.id}
            isInDragGroup={draggingGroup?.includes(ch.chapterNode.id) || false}
            onMouseDown={(e) => handleMouseDown(e, ch.chapterNode.id)}
            onMouseUp={() => { }} // Handled by global listener
            onDoubleClick={() => { }} // Handled by our logic
            onEditNode={onEditNode}
            chapterIndex={chapterIndex}
            focusedNodeId={focusedNodeId}
          />
          {ch.scenes.map((sc, sceneIndex) =>
            sc.nodes.map((n) => (
              <Node
                key={n.id}
                node={n}
                parentChapterId={ch.id}
                parentSceneId={sc.id}
                chapterColor={ch.color}
                sceneColor={sc.color}
                isDragging={draggingNodeId === n.id}
                isInDragGroup={draggingGroup?.includes(n.id) || false}
                onMouseDown={(e) => handleMouseDown(e, n.id)}
                onMouseUp={() => { }} // Handled by global listener
                onDoubleClick={() => { }} // Handled by our logic
                onEditNode={onEditNode}
                chapterIndex={chapterIndex}
                sceneIndex={sceneIndex}
                focusedNodeId={focusedNodeId}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}