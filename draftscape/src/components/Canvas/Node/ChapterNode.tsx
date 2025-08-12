import type { NodeProps } from "./Node";
import type { ChapterNode as ChapterNodeType, NodeData } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";

/** Normalize chapter color */
function resolveChapterColor(input?: string | number): string {
  if (typeof input === "number") return `var(--chapter-color-${input + 1})`;
  if (typeof input === "string" && input.trim()) return input;
  return "var(--chapter-color-1)";
}

// Make a soft tint that works with CSS vars
const softTint = (color: string, pct = 20) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function ChapterNode({
  node,
  chapterColor,
  isDragging,
  isInDragGroup,
  onMouseDown,
  onEditNode,
  chapterIndex,
  focusedNodeId,
}: NodeProps & { focusedNodeId?: string; chapterIndex?: number }) {
  const chapterNode = node as ChapterNodeType;
  const resolvedChapterColor = resolveChapterColor(chapterColor);
  const glowColor = resolvedChapterColor || "var(--color-accent)";
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // ✅ Access story and get children from flat structure
  const story = useStoryStore((state) => state.story);

  // Children of this chapter (scenes, media, etc.)
  const childIds = story.childrenOrder[node.id] ?? [];
  const attachedMedia = childIds
    .map((id) => story.nodeMap[id])
    .filter(
      (n): n is NodeData =>
        !!n &&
        (n.type === "picture" || n.type === "annotation" || n.type === "event")
    );

  return (
    <>
      <div
        data-node-id={node.id}
        onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
        style={{
          ...baseStyle,
          background: isFocused ? "var(--color-warningBg)" : "var(--color-bg)",
          border: "1px solid var(--color-border)",
          top: node.position.y,
          left: node.position.x,
          cursor: isDragging ? "grabbing" : "grab",
          transition: "box-shadow 0.25s ease",
          zIndex: 80,
          position: "absolute",
        }}
      >
        {/* Subtle color wash */}
        {!isFocused && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: softTint(resolvedChapterColor, 20),
              pointerEvents: "none",
              borderRadius: "6px",
              zIndex: 0,
            }}
          />
        )}

        <NodeActions nodeId={node.id} onEditNode={onEditNode} />

        <div
          style={{
            ...headerStyle(resolvedChapterColor),
            position: "relative",
            zIndex: 1,
          }}
        >
          📘 Chapter {chapterIndex !== undefined ? chapterIndex + 1 : "?"}
        </div>

        <div style={{ padding: "14px 8px", position: "relative", zIndex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{chapterNode.title}</div>
          {chapterNode.description && (
            <div style={{ fontSize: "12px", color: "var(--color-text)" }}>
              {chapterNode.description}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Render attached media nodes */}
      {attachedMedia.map((media) => (
        <div
          key={media.id}
          style={{
            position: "absolute",
            top: media.position.y,
            left: media.position.x,
            zIndex: 85,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
