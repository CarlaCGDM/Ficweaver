import { useRef, useLayoutEffect, useState } from "react";
import type { NodeProps } from "./Node";
import type { AnnotationNode as AnnotationNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";

export default function AnnotationNode({
  node,
  isDragging,
  isInDragGroup,
  onMouseDown,
  onEditNode,
  focusedNodeId,
}: NodeProps & { focusedNodeId?: string }) {
  const annotationNode = node as AnnotationNodeType;
  const isFocused = focusedNodeId === node.id;

  const baseStyle = baseNodeStyle(isInDragGroup, "#d4b483");

  const nodeRef = useRef<HTMLDivElement>(null);

  const [nodeSize, setNodeSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!nodeRef.current) return;

    const updateSize = () => {
      const el = nodeRef.current!;
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      setNodeSize({ width, height });
    };

    updateSize(); // Initial measure
    const observer = new ResizeObserver(updateSize);
    observer.observe(nodeRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      data-node-id={node.id}
      ref={nodeRef}
      onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
      style={{
        ...baseStyle,
        top: node.position.y,
        left: node.position.x,
        cursor: isDragging ? "grabbing" : "grab",
        background: "#fff8dc",
        border: "1px solid #e0d4a4",
        width: 250,
        padding: "8px",
        minHeight: 100,
        borderRadius: "6px",
        fontSize: "11px",
        lineHeight: "1.4",
        color: "#333",
        position: "absolute",
        zIndex: 101,
      }}
    >
      {/* Action buttons (always visible on hover logic handled by NodeActions) */}
      <NodeActions nodeId={node.id} onEditNode={onEditNode} />

      {/* Render rich text */}
      <div
        style={{ fontSize: "11px", lineHeight: "1.4", minHeight: "60px" }}
        dangerouslySetInnerHTML={{
          __html: "<p>" + annotationNode.text + "</p>" || "<p><i>(Empty annotation)</i></p>",
        }}
      />
    </div>
  );
}
