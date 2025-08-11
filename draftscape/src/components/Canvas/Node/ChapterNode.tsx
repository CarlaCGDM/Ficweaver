import type { NodeProps } from "./Node";
import type { ChapterNode as ChapterNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";

/** Normalize chapter color:
 *  - number  -> var(--chapter-color-N)  (N = index+1)
 *  - string  -> use as-is
 *  - empty   -> fallback to var(--chapter-color-1)
 */
function resolveChapterColor(input?: string | number): string {
  if (typeof input === "number") return `var(--chapter-color-${input + 1})`;
  if (typeof input === "string" && input.trim()) return input;
  return "var(--chapter-color-1)";
}

// Make a soft tint that also works with CSS vars
const softTint = (color: string, pct = 20) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function ChapterNode({ ...props }: NodeProps & { focusedNodeId?: string; chapterIndex?: number }) {
  const { node, chapterColor, isDragging, isInDragGroup, onMouseDown, onEditNode, chapterIndex, focusedNodeId } = props;
  const chapterNode = node as ChapterNodeType;

  const resolvedChapterColor = resolveChapterColor(chapterColor);
  const glowColor = resolvedChapterColor || "var(--color-accent)";
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // ✅ Access story to locate connected media
  const story = useStoryStore((state) => state.story);
  const parentChapter = story.chapters.find((ch) => ch.chapterNode.id === node.id);

  const attachedMedia =
    parentChapter?.scenes.flatMap((sc) =>
      sc.nodes.filter(
        (n) =>
          (n.type === "picture" || n.type === "annotation" || n.type === "event") &&
          n.connectedTo === node.id
      )
    ) || [];

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
        {/* Subtle color wash behind content */}
        {!isFocused && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: softTint(resolvedChapterColor, 20), // ~20% tint of chapter color
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

        <div style={{ padding: "8px", position: "relative", zIndex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{chapterNode.title}</div>
          {chapterNode.description && (
            <div style={{ fontSize: "12px", color: "var(--color-text)" }}>
              {chapterNode.description}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Render Attached Media */}
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
