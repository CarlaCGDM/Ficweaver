import type { CSSProperties } from "react";
import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";

interface Props {
  totalWords: number;
  viewMode: "text" | "chronology";
  onToggleView: () => void;
}

const buttonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  background: "var(--color-panel)",
  border: "none",
  borderRadius: "4px",
  fontFamily: "var(--font-ui)",
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--color-text)",
  padding: "6px 10px",
  cursor: "pointer",
  transition: "background 0.2s",
  height: "28px",
};

const hoverStyle: CSSProperties = {
  background: "var(--color-panelAlt)",
};

export default function TextEditorHeader({ totalWords, viewMode, onToggleView }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: "4px",
        marginBottom: "8px",
        fontFamily: "var(--font-ui)",
        color: "var(--color-text)",
      }}
    >
      <div style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--color-mutedText)" }}>
        <strong>Total Words:</strong> {totalWords.toLocaleString()}
      </div>

      <button
        onClick={onToggleView}
        style={{
          ...buttonStyle,
          ...(isHovered ? hoverStyle : {}),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ArrowRightLeft size={14} />
        {viewMode === "text" ? "Events View" : "Text View"}
      </button>
    </div>
  );
}
