import type { NodeProps } from "./Node";
import type { EventNode as EventNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";

export default function EventNode({
  node,
  isDragging,
  isInDragGroup,
  onMouseDown,
  onEditNode,
  focusedNodeId,
  isConnectMode,
}: NodeProps & { focusedNodeId?: string }) {
  const eventNode = node as EventNodeType;
  const isFocused = focusedNodeId === node.id;

  const baseStyle = baseNodeStyle(isInDragGroup, "var(--chapter-color-3)");

  // 🧠 Format date
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
      onMouseDown={(e) =>
        onMouseDown(e, node.id, node.position.x, node.position.y)
      }
      style={{
        ...baseStyle,
        top: node.position.y,
        left: node.position.x,
        cursor: isDragging ? "grabbing" : "grab",
        width: 500,
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        background: isFocused
          ? "var(--color-warningBg)"
          : "var(--color-panelAlt)",
        border: "1px solid var(--color-border)",
        borderRadius: "6px",
        boxShadow: "var(--node-shadow)",
        padding: "6px 10px",
        fontSize: "13px",
        color: "var(--color-text)",
        zIndex: 100,
        position: "absolute",
        gap: "6px",
        opacity: isConnectMode ? 0.35 : 1,

      }}
    >
      <NodeActions nodeId={node.id} onEditNode={onEditNode} />

      {/* Row: Emoji + Timestamp + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "18px" }}>⏱️</span>
        <span
          style={{
            fontWeight: "bold",
            whiteSpace: "nowrap",
            color: "var(--color-text)",
          }}
        >
          {timestamp || "???"}
        </span>
        <span style={{ margin: "0 4px" }}>—</span>
        <span
          style={{
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "var(--color-text)",
          }}
        >
          {eventNode.title || "(Untitled Event)"}
        </span>
      </div>

      {/* Description */}
      {eventNode.description && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
          dangerouslySetInnerHTML={{ __html: eventNode.description }}
        />
      )}

      {/* Tags */}
      {eventNode.tags && eventNode.tags.length > 0 && (
        <div style={{ fontSize: "10px", color: "var(--color-mutedText)" }}>
          Tags:{" "}
          {eventNode.tags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                background: "var(--color-panel)",
                color: "var(--color-text)",
                padding: "2px 6px",
                marginRight: "4px",
                borderRadius: "4px",
                fontSize: "10px",
                border: "1px solid var(--color-border)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
