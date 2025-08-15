import type { NodeProps } from "./Node";
import type { PictureNode as PictureNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";
import { useImageStore } from "../../../context/imageStore/imageStore";
import { useEffect, useState } from "react";

export default function PictureNode({
  node,
  isDragging,
  isInDragGroup,
  onMouseDown,
  onEditNode,
  focusedNodeId,
  isConnectMode,
}: NodeProps & { focusedNodeId?: string }) {
  const pictureNode = node as PictureNodeType;
  const isFocused = focusedNodeId === node.id;

  // Node base style now uses theme var for the accent border
  const baseStyle = baseNodeStyle(isInDragGroup, "var(--chapter-color-2)");

  const { imageMap } = useImageStore();
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  useEffect(() => {
    const imageData = imageMap[node.id];
    if (imageData) {
      setImageURL(imageData);
      const img = new Image();
      img.onload = () => setAspectRatio(img.width / img.height);
      img.src = imageData;
    } else {
      setImageURL(null);
    }
  }, [imageMap, node.id]);

  return (
    <div
      className="picture-node"
      data-node-id={node.id}
      onMouseDown={(e) =>
        onMouseDown(e, node.id, node.position.x, node.position.y)
      }
      style={{
        ...baseStyle,
        top: node.position.y,
        left: node.position.x,
        cursor: isDragging ? "grabbing" : "grab",
        width: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "var(--color-bg)",
        borderRadius: "6px",
        boxShadow: "var(--node-shadow)",
        padding: "6px",
        zIndex: 100,
        opacity: isConnectMode ? 0.35 : 1,
      }}
    >
      <NodeActions nodeId={node.id} onEditNode={onEditNode} />

      {/* Image Block */}
      <div
        style={{
          width: "100%",
          height: `${200 / aspectRatio}px`,
          background: "var(--color-panel)",
          borderRadius: "4px",
          marginBottom: "6px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {imageURL ? (
          <img
            src={imageURL}
            alt={pictureNode.description || "Picture"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <span style={{ fontSize: "12px", color: "var(--color-mutedText)" }}>
            No Image
          </span>
        )}
      </div>

      {/* Description Below */}
      <div
        style={{
          fontSize: "11px",
          textAlign: "center",
          color: "var(--color-text)",
        }}
      >
        {pictureNode.description || "Picture description"}
      </div>
    </div>
  );
}
