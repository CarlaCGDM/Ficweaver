import Node from "./Node/Node";
import { useRef, useCallback, useEffect } from "react";
import type { Story, NodeData } from "../../context/storyStore/types";
import { collectCanvasDragGroup } from "../../context/storyStore/helpers";
import { useStoryStore } from "../../context/storyStore/storyStore";
import { useConnectStore } from "../../context/uiStore/connectStore";

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
  const mouseDownInfoRef = useRef<{ nodeId: string; startPos: { x: number; y: number } } | null>(null);
  const isDraggingRef = useRef(false);

  const { isConnecting, targets, tryComplete, cancelConnect, sourceId } = useConnectStore();
  const validSet = new Set(Object.keys(targets));

  // ESC to cancel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cancelConnect(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelConnect]);

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
    document.removeEventListener("mousemove", handleGlobalMouseMove);
    document.removeEventListener("mouseup", handleGlobalMouseUp);

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

    // Don't drag if it's connecting
    if (isConnecting) {
      e.stopPropagation();
      e.preventDefault();
      tryComplete(nodeId); // only completes if nodeId in targets
      return;
    }

    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select, [contenteditable]")) return;

    e.stopPropagation();
    e.preventDefault();

    mouseDownInfoRef.current = {
      nodeId,
      startPos: { x: e.clientX, y: e.clientY }
    };
    isDraggingRef.current = false;
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  /**
   * Recursive renderer: renders a node and its children
   */
  const renderNodeAndChildren = (
    nodeId: string,
    parentChapterId?: string,
    parentSceneId?: string,
    chapterIndex?: number,
    sceneIndex?: number
  ) => {
    const node = story.nodeMap[nodeId];
    if (!node) return null;

    // color tokens — chapterIndex is only used for chapter/scenes
    const chapterColorToken = chapterIndex !== undefined
      ? chapterIndex % 5 // or theme length
      : undefined;

    return (
      <div key={node.id}>
        <Node
          node={node}
          parentChapterId={parentChapterId}
          parentSceneId={parentSceneId}
          chapterColor={chapterColorToken}
          isDragging={draggingNodeId === node.id}
          isInDragGroup={draggingGroup?.includes(node.id) || false}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
          onMouseUp={() => { }}
          onDoubleClick={() => { }}
          onEditNode={onEditNode}
          chapterIndex={chapterIndex}
          sceneIndex={sceneIndex}
          focusedNodeId={focusedNodeId}
          isConnectMode={isConnecting}
          isValidConnectTarget={isConnecting ? validSet.has(node.id) : false}
          isConnectSource={isConnecting ? sourceId === node.id : false}
        />
        {/* Render children recursively */}
        {(story.childrenOrder[node.id] ?? []).map((childId, idx) =>
          renderNodeAndChildren(
            childId,
            node.type === "chapter" ? node.id : parentChapterId,
            node.type === "scene" ? node.id : parentSceneId,
            // ✅ preserve the original chapterIndex for all descendants
            chapterIndex,
            // ✅ only scenes get a fresh sceneIndex
            node.type === "scene" ? idx : sceneIndex
          )
        )}
      </div>
    );
  };

  return (
    <div style={{ transform: "translate(10000px, 10000px)" }}>
      {story.order.map((chapterId, idx) =>
        renderNodeAndChildren(chapterId, chapterId, undefined, idx)
      )}
    </div>
  );
}
