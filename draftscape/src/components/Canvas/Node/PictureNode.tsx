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
}: NodeProps & { focusedNodeId?: string }) {
  const pictureNode = node as PictureNodeType;
  const isFocused = focusedNodeId === node.id;

  const baseStyle = baseNodeStyle(isInDragGroup, "#8B5E3C");

  // ✅ Access the image store to retrieve the image (now stored as Base64 string)
  const { imageMap } = useImageStore();
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1); // width/height ratio

  useEffect(() => {
    const imageData = imageMap[node.id];

    if (imageData) {
      // ✅ imageData is always a base64 string now
      setImageURL(imageData);

      // Calculate aspect ratio
      const img = new Image();
      img.onload = () => setAspectRatio(img.width / img.height);
      img.src = imageData;
    } else {
      setImageURL(null);
    }
  }, [imageMap, node.id]);


  return (
    <div
      data-node-id={node.id}
      onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
      style={{
        ...baseStyle,
        top: node.position.y,
        left: node.position.x,
        cursor: isDragging ? "grabbing" : "grab",
        width: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#fff",
        borderRadius: "6px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
        padding: "6px",
        zIndex: 100,
      }}
    >
      <NodeActions nodeId={node.id} onEditNode={onEditNode} />

      {/* Image Block */}
      <div
        style={{
          width: "100%",
          height: `${200 / aspectRatio}px`,
          background: "#eee",
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
              objectFit: "contain", // maintain proportions inside container
            }}
          />
        ) : (
          <span style={{ fontSize: "12px", color: "#777" }}>No Image</span>
        )}
      </div>

      {/* Description Below */}
      <div style={{ fontSize: "11px", textAlign: "center", color: "#333" }}>
        {pictureNode.description || "Picture description"}
      </div>
    </div>
  );
}
