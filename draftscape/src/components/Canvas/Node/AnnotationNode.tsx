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

  // Use theme vars for accent used by baseNodeStyle (hover/drag rings etc.)
  const baseStyle = baseNodeStyle(isInDragGroup, "var(--annotation-accent)");

  const nodeRef = useRef<HTMLDivElement>(null);
  const [nodeSize, setNodeSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!nodeRef.current) return;
    const updateSize = () => {
      const el = nodeRef.current!;
      setNodeSize({ width: el.offsetWidth, height: el.offsetHeight });
    };
    updateSize();
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
        position: "absolute",
        top: node.position.y,
        left: node.position.x,
        cursor: isDragging ? "grabbing" : "grab",

        background: "var(--color-warningBg)",
        border: "1px solid var(--color-warningBorder)",
        boxShadow: "var(--node-shadow)",

        width: 250,
        minHeight: 100,
        padding: "8px",
        borderRadius: "6px",
        fontSize: "11px",
        lineHeight: "1.4",
        zIndex: 101,
      }}
    >
      <NodeActions nodeId={node.id} onEditNode={onEditNode} />

      <div
        style={{ fontSize: "11px", lineHeight: "1.4", minHeight: "60px", }}
        dangerouslySetInnerHTML={{
          __html: "<p>" + (annotationNode.text || "<i>(Empty annotation)</i>") + "</p>",
        }}
      />
    </div>
  );
}
