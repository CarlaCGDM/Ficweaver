import type { CSSProperties } from "react";

// ✅ Shared base style for all nodes
export const baseNodeStyle = (
  isInDragGroup: boolean,
  glowColor: string
): CSSProperties => ({
  position: "absolute",
  width: "600px",
  minHeight: "40px",
  background: "white",
  //border: isInDragGroup ? `2px solid ${glowColor}` : "1px solid #ccc",
  borderRadius: "6px",
  boxShadow: isInDragGroup
    ? `0 0 10px ${glowColor}80`
    : "0 2px 5px rgba(0,0,0,0.1)",
  overflow: "visible", // ✅ Changed from "hidden" to "visible"
  userSelect: "none",
});

// ✅ Header style (for Chapter & Scene)
export const headerStyle = (color: string): CSSProperties => ({
  background: color,
  color: "white",
  fontSize: "12px",
  fontWeight: "bold",
  padding: "4px 6px",
  borderTopLeftRadius: "6px",
  borderTopRightRadius: "6px",
});

// ✅ Mini-header style (for TextNode chapter/scene labels)
export const miniHeaderStyle = (color: string): CSSProperties => ({
  background: color,
  color: "white",
  fontSize: "10px",
  padding: "2px 4px",
  borderRadius: "3px",
  marginBottom: "2px",
});