import type { CSSProperties } from "react";

export const outlinePanelContainer: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "300px",
  minWidth: "200px",
  maxWidth: "400px",
  borderRight: "1px solid #ddd",
  background: "#f9f9f9",
  fontFamily: "sans-serif",
  fontSize: "14px",
};

// ✅ Scrollable content inside OutlinePanel
export const scrollContainer: CSSProperties = {
  overflowY: "auto",
  flex: 1,
  padding: "10px",
};

// ✅ Toolbar container (fixed at top of panel)
export const toolbarContainer: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  background: "#f8f8f8",
  borderBottom: "1px solid #ddd",
  width: "100%",
  flexShrink: 0,
};

// ✅ Toolbar button style (New/Save/Load)
export const toolbarBtnStyle: CSSProperties = {
  background: "transparent",
  width: "7vw",
  border: "none",
  fontFamily: "'Fredoka', sans-serif",
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
  padding: "8px 0px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  gap: "4px",
  borderRadius: "0px",
  transition: "background 0.2s",
};

// ✅ Title row (story title + edit button)
export const titleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
};

// ✅ Control row (Add Chapter, Open/Close All, Show Actions)
export const controlsRowStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
  marginBottom: "8px",
};

// ✅ Reusable button style (Add Chapter, Open/Close, Actions)
export const buttonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  background: "#f0f0f0",
  border: "none",
  borderRadius: "4px",
  fontFamily: "'Fredoka', sans-serif",
  fontSize: "12px",
  fontWeight: "500",
  color: "#333",
  padding: "2px 4px",
  cursor: "pointer",
  transition: "background 0.2s",
};

// ✅ Base hoverable row style
export const hoverRowStyle = (color: string): CSSProperties => ({
  background: color,
  display: "flex",
  alignItems: "center",
  padding: "4px 6px",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "background 0.2s ease-in-out",
});

// ✅ Chapter header style (solid color)
export const chapterHeaderStyle = (color: string): CSSProperties => ({
  ...hoverRowStyle(color),
  background: color,
  color: "white",
  fontWeight: "bold",
  marginBottom: "4px",
});

// ✅ Scene header style (diluted color)
export const sceneHeaderStyle = (color: string): CSSProperties => ({
  ...hoverRowStyle(color),
  background: `${color}88`,
  color: "white",
  fontWeight: 500,
  marginBottom: "4px",
});

// ✅ Text item style (plain)
export const textItemStyle = (): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  padding: "2px 0",
  fontSize: "12px",
  color: "#333",
  marginBottom: "2px",
});

// ✅ Pin (chevron) button
export const pinButtonStyle: CSSProperties = {
  marginRight: "6px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "12px",
};

// ✅ Row of action buttons (edit/delete/insert)
export const buttonRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "4px",
  marginTop: "2px",
  marginBottom: "4px",
};

// Highlighted or normal text item styles
export const textItemBaseStyle: CSSProperties = {
  ...textItemStyle(),
  borderRadius: "4px",
  cursor: "pointer",
  padding: "4px 6px",
  transition: "background 0.2s ease-in-out",
};

export const textItemFocusedStyle: CSSProperties = {
  ...textItemBaseStyle,
  background: "rgb(255, 240, 189)",
};

export const textItemUnfocusedStyle: CSSProperties = {
  ...textItemBaseStyle,
  background: "white",
};
