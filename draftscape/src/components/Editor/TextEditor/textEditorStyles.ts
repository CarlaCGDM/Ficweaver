import type { CSSProperties } from "react";

/* Container that wraps the editor column */
export const editorContainer: CSSProperties = {
  overflowY: "auto",
  height: "100%",
  padding: "16px",
  fontFamily: "var(--font-ui)",
  color: "var(--color-text)",
  lineHeight: "1.5",
  borderLeft: "1px solid var(--color-border)",
  background: "var(--color-bg)",
  position: "relative" 
};

/* Word count / meta line */
export const totalWordsStyle: CSSProperties = {
  fontSize: "12px",
  color: "var(--color-mutedText)",
  marginBottom: "12px",
};

/* Clickable chapter title row */
export const chapterTitleStyle = (color: string, isHovered: boolean): CSSProperties => ({
  marginBottom: "8px",
  background: isHovered ? `${color}22` : "transparent",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "background 0.25s ease",
  color: "var(--color-text)",
});

/* Small muted summary line shown on hover */
export const hoverSummaryStyle = (): CSSProperties => ({
  fontSize: "12px",
  color: "var(--color-mutedText)",
  marginTop: "4px",
  opacity: 1,
  transition: "opacity 0.25s ease",
});

/* Divider text between scenes */
export const sceneSeparatorStyle: CSSProperties = {
  textAlign: "center",
  color: "var(--color-mutedText)",
  fontSize: "10px",
  margin: "8px 0",
};

/* The text block container (reacts to various hover states) */
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
  color: "var(--color-text)",
});

/* The vertical accent line to the left of a text block */
export const verticalLineStyle = (color: string, active: boolean): CSSProperties => ({
  width: "4px",
  background: active ? color : "transparent",
  borderTopLeftRadius: "4px",
  borderBottomLeftRadius: "4px",
  transition: "background 0.25s ease",
});

/* The hover popover with controls/summary */
export const hoverOverlayStyle = (color: string): CSSProperties => ({
  position: "absolute",
  top: "-70px",
  right: "-10px",
  background: "var(--color-panel)",            // was rgba(255,255,255,0.95)
  border: `1px solid ${color}55`,
  borderRadius: "4px",
  padding: "4px 6px",
  fontSize: "11px",
  color: "var(--color-text)",
  boxShadow: "var(--node-shadow)",
  opacity: 1,
  transform: "translateY(5px)",
  animation: "fadeSlideUp 0.25s ease forwards",
  zIndex: 2,
  width: "calc(100% - 200px)",
});
