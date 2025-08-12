import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useStoryStore } from "../../context/storyStore/storyStore";
import { useState, useRef, useEffect } from "react";
import CanvasOverlay from "./CanvasOverlay";
import CanvasGrid from "./CanvasGrid";
import CanvasNodes from "./CanvasNodes";
import { useCanvasFocus } from "./hooks/useCanvasFocus";
import { useCanvasDrag } from "./hooks/useCanvasDrag";
import NodeConnections from "./NodeConnections";
import type { NodeData } from "../../context/storyStore/types";

interface CanvasProps {
  onExposeFocus?: (focus: (nodeId?: string) => void) => void;
  onEditNode: (node: NodeData) => void;
  onFocusNode: (nodeId: string) => void; // ✅ Add global focus handler
  focusedNodeId?: string;
  className?: string;
}

export default function Canvas({
  onExposeFocus,
  onEditNode,
  onFocusNode, // ✅ Add this prop
  focusedNodeId,
  className,
}: CanvasProps) {
  const story = useStoryStore((state) => state.story);
  const updateNodePosition = useStoryStore((state) => state.updateNodePosition);

  const transformRef = useRef<any>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingGroup, setDraggingGroup] = useState<string[] | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const { focusNode, resetView } = useCanvasFocus(transformRef, story);

  useEffect(() => {
    if (onExposeFocus) onExposeFocus(focusNode);
  }, [focusNode, onExposeFocus]);

  const handleZoomChange = (ref: any) => setZoomScale(ref?.state?.scale || 1);

  const findNodeById = (nodeId: string) => {
    return useStoryStore.getState().story.nodeMap[nodeId] ?? null;
  };

  // ✅ Handle double-click: call global focus first, then canvas focus
  const handleNodeDoubleClick = (nodeId: string) => {
    console.log("🎯 Canvas double-click on node:", nodeId);

    // 1. Trigger global focus (updates all components, applies highlights)
    onFocusNode(nodeId);

    // 2. Then do canvas-specific focusing (zoom/pan to node)
    focusNode(nodeId);
  };

  useCanvasDrag(
    story,
    zoomScale,
    draggingNodeId,
    draggingGroup,
    updateNodePosition,
    findNodeById,
    () => {
      setDraggingNodeId(null);
      setDraggingGroup(null);
    }
  );

  return (
    <div className={`canvas-container ${className ?? ""}`} style={{ position: "relative" }}>
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.1}
        maxScale={4}
        limitToBounds={false}
        centerOnInit
        doubleClick={{ disabled: true }} // ✅ Disable double-click zoom
        onTransformed={handleZoomChange}
      >
        <CanvasOverlay
          onResetView={resetView}
          onZoomIn={() => transformRef.current?.zoomIn()}
          onZoomOut={() => transformRef.current?.zoomOut()}
        />
        <TransformComponent>
          <CanvasGrid>
            <NodeConnections story={story} />
            <CanvasNodes
              story={story}
              draggingNodeId={draggingNodeId}
              draggingGroup={draggingGroup}
              setDraggingNodeId={setDraggingNodeId}
              setDraggingGroup={setDraggingGroup}
              onEditNode={onEditNode}
              onNodeDoubleClick={handleNodeDoubleClick} // ✅ Use new handler
              focusedNodeId={focusedNodeId} // ✅ Pass down
            />
          </CanvasGrid>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}