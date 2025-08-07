import type { NodeProps } from "./Node";
import type { SceneNode as SceneNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";

import { useStoryStore } from "../../../context/storyStore/storyStore";

export default function SceneNode({ ...props }: NodeProps & { focusedNodeId?: string }) {
  const { node, chapterColor, sceneColor, isDragging, isInDragGroup, onMouseDown, onEditNode, chapterIndex, sceneIndex, focusedNodeId } = props;
  const sceneNode = node as SceneNodeType;
  const glowColor = chapterColor || "#007BFF";
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // ✅ Access story to locate connected media
  const story = useStoryStore((state) => state.story);
  const parentChapter = story.chapters.find((ch) => ch.id === props.parentChapterId);
  const parentScene = parentChapter?.scenes.find((sc) => sc.nodes.some((n) => n.id === node.id));

  const attachedMedia = parentScene?.nodes.filter(
    (n) => (n.type === "picture" || n.type === "annotation") && n.connectedTo === node.id
  ) || [];

  return (
    <>
      {/* Main Scene Node */}
      <div
        onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
        style={{
          ...baseStyle,
          background: isFocused ? "rgb(255, 240, 189)" : "white",
          top: node.position.y,
          left: node.position.x,
          cursor: isDragging ? "grabbing" : "grab",
          boxShadow: isFocused
            ? `${baseStyle.boxShadow}, 0 0 10px ${sceneColor}80`
            : baseStyle.boxShadow,
          transition: "box-shadow 0.25s ease",
          zIndex: 90,
          position: "absolute",
        }}
      >
        <NodeActions nodeId={node.id} onEditNode={onEditNode} />
        <div style={{ ...headerStyle("transparent"), background: `${sceneColor}AA`, color: "#fff", position: "relative", zIndex: 1 }}>
          🎬 Chapter {chapterIndex !== undefined ? chapterIndex + 1 : "?"}, Scene {sceneIndex !== undefined ? sceneIndex + 1 : "?"}
        </div>
        <div style={{ padding: "8px", position: "relative", zIndex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{sceneNode.title}</div>
          {sceneNode.description && <div style={{ fontSize: "12px", color: "#444" }}>{sceneNode.description}</div>}
        </div>
      </div>

      {/* ✅ Render Attached Media (pictures & annotations) */}
      {attachedMedia.map((media) => (
        <div
          key={media.id}
          style={{
            position: "absolute",
            top: media.position.y,
            left: media.position.x,
            zIndex: 95,
            pointerEvents: "none", // Media drag is handled separately by CanvasNodes
          }}
        >
          {/* Could use PictureNode/AnnotationNode here if desired */}
        </div>
      ))}
    </>
  );
}

