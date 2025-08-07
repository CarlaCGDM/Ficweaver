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
}: NodeProps & { focusedNodeId?: string }) {
    const eventNode = node as EventNodeType;
    const isFocused = focusedNodeId === node.id;

    const baseStyle = baseNodeStyle(isInDragGroup, "#444");

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
                background: isFocused ? "rgb(255, 240, 189)" : "rgb(246, 246, 246)",
                border: "1px solid rgb(210, 210, 210)",
                borderRadius: "6px",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                padding: "6px 10px",
                fontSize: "13px",
                color: "#222",
                zIndex: 100,
                position: "absolute",
                gap: "6px",
            }}
        >
            <NodeActions nodeId={node.id} onEditNode={onEditNode} />

            {/* Row: Emoji + Timestamp + Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>⏱️</span>
                <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>{timestamp || "???"}</span>
                <span style={{ margin: "0 4px" }}>—</span>
                <span
                    style={{
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {eventNode.title || "(Untitled Event)"}
                </span>
            </div>

            {/* 🆕 Description */}
            {eventNode.description && (
                <div
                    style={{
                        fontSize: "12px",
                        color: "#444",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3, // limit to 3 lines for compactness
                        WebkitBoxOrient: "vertical",
                    }}
                    // ✅ Render as HTML
                    dangerouslySetInnerHTML={{ __html: eventNode.description }}
                />
            )}

            {/* Tags */}
            {eventNode.tags && eventNode.tags.length > 0 && (
                <div style={{ fontSize: "10px", color: "#666" }}>
                    Tags:{" "}
                    {eventNode.tags.map((tag, idx) => (
                        <span
                            key={idx}
                            style={{
                                background: "#eee",
                                padding: "2px 6px",
                                marginRight: "4px",
                                borderRadius: "4px",
                                fontSize: "10px",
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
