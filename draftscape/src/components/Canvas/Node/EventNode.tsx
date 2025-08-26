// src/components/Canvas/Node/EventNode.tsx
import type { NodeProps } from "./Node";
import type { EventNode as EventNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle } from "./nodeStyles";
import NodeActions from "./NodeActions/NodeActions";

export default function EventNode({
  node,
  isDragging,
  isInDragGroup,
  onMouseDown,
  onEditNode,
  focusedNodeId,
  isConnectMode,
  isConnectSource,
}: NodeProps & { focusedNodeId?: string }) {
  const eventNode = node as EventNodeType;
  const isFocused = focusedNodeId === node.id;

  const baseStyle = baseNodeStyle(isInDragGroup, "var(--chapter-color-3)");

  // Format date
  const timestamp = [
    eventNode.year,
    eventNode.month?.toString().padStart(2, "0"),
    eventNode.day?.toString().padStart(2, "0"),
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div
      data-node-id={node.id}
      onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
      style={{
        ...baseStyle,
        top: node.position.y,
        left: node.position.x,
        cursor: isDragging ? "grabbing" : "grab",
        width: 500,
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        background: isFocused ? "var(--color-warningBg)" : "var(--color-panelAlt)",
        border: "1px solid var(--color-border)",
        borderRadius: "6px",
        boxShadow: "var(--node-shadow)",
        padding: "6px 10px",
        color: "var(--color-text)",
        zIndex: 100,
        position: "absolute",
        opacity: isConnectMode && !isConnectSource ? 0.35 : 1,
      }}
    >
      <NodeActions nodeId={node.id} onEditNode={onEditNode} />

      {/* Time row */}
      <p style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
        <p aria-hidden>⏱️</p>
        <p style={{ fontWeight: 700, whiteSpace: "nowrap", color: "var(--color-text)" }}>
          {timestamp || "???"}
        </p>
        -
        <p style={{ fontWeight: 700, whiteSpace: "nowrap", color: "var(--color-text)" }}>
          {eventNode.title || "(Untitled Event)"}
        </p>
      </p>

      {/* Description (rich HTML) */}
      {eventNode.description && (
        <small
          style={{
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            lineHeight: "1.4",
          }}
          // the HTML can include its own <p>/<small>/<h*>; this wrapper is a clamped block
          dangerouslySetInnerHTML={{ __html: eventNode.description }}
        />
      )}

      {/* Tags */}
      {eventNode.tags && eventNode.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "6px",
            alignItems: "center",
            color: "var(--color-mutedText)",
          }}
        >
          {eventNode.tags.map((tag, idx) => (
            <small
              key={idx}
              style={{
                background: "var(--color-panel)",
                color: "var(--color-text)",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid var(--color-border)",
              }}
            >
              {tag}
            </small>
          ))}
        </div>
      )}
    </div>
  );
}
