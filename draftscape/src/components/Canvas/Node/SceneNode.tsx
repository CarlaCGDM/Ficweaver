import type { NodeProps } from "./Node";
import type { SceneNode as SceneNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";

// Accepts string | number | undefined without upsetting TS
function resolveColor(input: unknown, fallbackVar: string): string {
  if (typeof input === "number") return `var(--chapter-color-${input + 1})`;
  if (typeof input === "string" && input.trim()) return input;
  return fallbackVar;
}

const softTint = (color: string, pct = 16) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function SceneNode({ ...props }: NodeProps & { focusedNodeId?: string; chapterIndex?: number; sceneIndex?: number }) {
  const {
    node,
    chapterColor,
    sceneColor,
    isDragging,
    isInDragGroup,
    onMouseDown,
    onEditNode,
    chapterIndex,
    sceneIndex,
    focusedNodeId,
  } = props;

  const sceneNode = node as SceneNodeType;

  // Normalize colors
  const resolvedChapterColor = resolveColor(chapterColor, "var(--chapter-color-1)");
  const resolvedSceneColor   = resolveColor(sceneColor ?? chapterColor, resolvedChapterColor);

  const glowColor = resolvedChapterColor;
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // ✅ Access story to locate connected media
  const story = useStoryStore((state) => state.story);
  const parentChapter = story.chapters.find((ch) => ch.id === (props as any).parentChapterId);
  const parentScene = parentChapter?.scenes.find((sc) =>
    sc.nodes.some((n) => n.id === node.id)
  );

  const attachedMedia =
    parentScene?.nodes.filter(
      (n) =>
        (n.type === "picture" || n.type === "annotation" || n.type === "event") &&
        n.connectedTo === node.id
    ) || [];

  return (
    <>
      {/* Main Scene Node */}
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
          zIndex: 90,
          position: "absolute",
        }}
      >
        {/* Subtle color wash like ChapterNode (only when not focused) */}
        {!isFocused && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: softTint(resolvedSceneColor, 16),
              pointerEvents: "none",
              borderRadius: "6px",
              zIndex: 0,
            }}
          />
        )}

        <NodeActions nodeId={node.id} onEditNode={onEditNode} />

        {/* Header uses the resolved scene color */}
        <div
          style={{
            ...headerStyle(resolvedSceneColor),
            position: "relative",
            zIndex: 1,
          }}
        >
          🎬 Chapter {chapterIndex !== undefined ? chapterIndex + 1 : "?"}, Scene{" "}
          {sceneIndex !== undefined ? sceneIndex + 1 : "?"}
        </div>

        {/* Body */}
        <div style={{ padding: "8px", position: "relative", zIndex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px", color: "var(--color-text)" }}>
            {sceneNode.title}
          </div>
          {sceneNode.description && (
            <div style={{ fontSize: "12px", color: "var(--color-text)" }}>
              {sceneNode.description}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Render Attached Media (pictures & annotations & events) */}
      {attachedMedia.map((media) => (
        <div
          key={media.id}
          style={{
            position: "absolute",
            top: media.position.y,
            left: media.position.x,
            zIndex: 95,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
