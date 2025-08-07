import type { NodeProps } from "./Node";
import type { ChapterNode as ChapterNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";

import { useStoryStore } from "../../../context/storyStore/storyStore";

export default function ChapterNode({ ...props }: NodeProps & { focusedNodeId?: string }) {
  const { node, chapterColor, isDragging, isInDragGroup, onMouseDown, onEditNode, chapterIndex, focusedNodeId } = props;
  const chapterNode = node as ChapterNodeType;
  const glowColor = chapterColor || "#007BFF";
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // ✅ Access story to locate connected media
  const story = useStoryStore((state) => state.story);
  const parentChapter = story.chapters.find((ch) => ch.chapterNode.id === node.id);

  const attachedMedia = parentChapter?.scenes.flatMap((sc) =>
    sc.nodes.filter((n) => (n.type === "picture" || n.type === "annotation") && n.connectedTo === node.id)
  ) || [];

  return (
    <>
      <div
        onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
        style={{
          ...baseStyle,
          background: isFocused ? "rgb(255, 240, 189)" : "white",
          top: node.position.y,
          left: node.position.x,
          cursor: isDragging ? "grabbing" : "grab",
          transition: "box-shadow 0.25s ease",
          zIndex: 80,
          position: "absolute",
        }}
      >
        <NodeActions nodeId={node.id} onEditNode={onEditNode} />
        <div style={headerStyle(chapterColor || "#fdf3d0")}>
          📘 Chapter {chapterIndex !== undefined ? chapterIndex + 1 : "?"}
        </div>
        <div style={{ padding: "8px", position: "relative", zIndex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{chapterNode.title}</div>
          {chapterNode.description && <div style={{ fontSize: "12px", color: "#444" }}>{chapterNode.description}</div>}
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
