import type { CSSProperties } from "react";

export const editorContainer: CSSProperties = {
  overflowY: "auto",
  height: "100%",
  padding: "16px",
  fontFamily: "sans-serif",
  lineHeight: "1.5",
};

export const totalWordsStyle: CSSProperties = {
  fontSize: "12px",
  color: "#666",
  marginBottom: "12px",
};

export const chapterTitleStyle = (color: string, isHovered: boolean): CSSProperties => ({
  marginBottom: "8px",
  background: isHovered ? `${color}22` : "transparent",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "background 0.25s ease",
});

export const hoverSummaryStyle = (): CSSProperties => ({
  fontSize: "12px",
  color: "#777",
  marginTop: "4px",
  opacity: 1,
  transition: "opacity 0.25s ease",
});

export const sceneSeparatorStyle: CSSProperties = {
  textAlign: "center",
  color: "#bbb",
  fontSize: "10px",
  margin: "8px 0",
};

export const textContainerStyle = (
  color: string,
  isHoveredText: boolean,
  isHoveredSibling: boolean,
  isChapterHover: boolean
): CSSProperties => ({
  flex: 1,
  padding: "6px",
  borderRadius: "0 6px 6px 0",
  background: isHoveredText
    ? `${color}22`
    : isHoveredSibling
    ? `${color}10`
    : isChapterHover
    ? `${color}08`
    : "transparent",
  transition: "background 0.25s ease",
  position: "relative",
});

export const verticalLineStyle = (color: string, active: boolean): CSSProperties => ({
  width: "4px",
  background: active ? color : "transparent",
  borderTopLeftRadius: "4px",
  borderBottomLeftRadius: "4px",
  transition: "background 0.25s ease",
});

export const hoverOverlayStyle = (color: string): CSSProperties => ({
  position: "absolute",
  top: "-70px",
  right: "-10px",
  background: "rgba(255,255,255,0.95)",
  border: `1px solid ${color}55`,
  borderRadius: "4px",
  padding: "4px 6px",
  fontSize: "11px",
  color: "#444",
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  opacity: 1,
  transform: "translateY(5px)",
  animation: "fadeSlideUp 0.25s ease forwards",
  zIndex: 2,
  width: "calc(100% - 200px)",
});
