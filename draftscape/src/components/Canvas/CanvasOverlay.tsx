import { useEffect, useState } from "react";
import { useStoryStore } from "../../context/storyStore/storyStore";
import { Undo2, Redo2, Hand, MousePointer, Move, X, ZoomIn, Maximize } from "lucide-react";
import { PiQuestionMarkLight } from "react-icons/pi";

interface CanvasOverlayProps {
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function CanvasOverlay({ onResetView, onZoomIn, onZoomOut }: CanvasOverlayProps) {
  const undo = useStoryStore((s) => s.undo);
  const redo = useStoryStore((s) => s.redo);
  const past = useStoryStore((s) => s.past ?? []);
  const future = useStoryStore((s) => s.future ?? []);


  const [showGuide, setShowGuide] = useState(false);

  // ✅ Keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrCmd && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        if (past.length > 0) undo();
      }
      if (
        (ctrlOrCmd && e.key.toLowerCase() === "z" && e.shiftKey) ||
        (ctrlOrCmd && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        if (future.length > 0) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, past.length, future.length]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {/* 🔄 Undo/Redo (Top Right) */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={undo}
          disabled={past.length === 0}
          title="Undo (Ctrl+Z)"
          style={{
            ...iconButtonStyle,
            opacity: past.length === 0 ? 0.5 : 1,
            cursor: past.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          <Undo2 size={18} style={{ marginRight: "6px" }} />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (Ctrl+Shift+Z or Ctrl+Y)"
          style={{
            ...iconButtonStyle,
            opacity: future.length === 0 ? 0.5 : 1,
            cursor: future.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          <Redo2 size={18} style={{ marginRight: "6px" }} />
          Redo
        </button>
      </div>

      {/* ❓ Help Button (Bottom Left) */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          pointerEvents: "auto",
        }}
        onMouseEnter={() => setShowGuide(true)}
        onMouseLeave={() => setShowGuide(false)}
      >
        {/* The "?" button */}
        <button
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "1px solid #ccc",
            background: "white",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PiQuestionMarkLight size={20} />
        </button>

        {/* The hover guide */}
        {showGuide && (
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: 0,
              width: "260px",
              background: "white",
              borderRadius: "6px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              fontFamily: "'Fredoka', sans-serif",
              fontSize: "12px",
              color: "#333",
              lineHeight: 1.6,
              padding: "10px",
              zIndex: 1001,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Hand size={14} color={"#766DA7"} /> <span style={guideKeywordStyle}>Pan</span> - Left/middle mouse button
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Move size={14} color={"#766DA7"} /> <span style={guideKeywordStyle}>Move node</span> - Left click + drag
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MousePointer size={14} color={"#766DA7"} /> <span style={guideKeywordStyle}>Select node</span> - Double left click
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <X size={14} color={"#766DA7"} /> <span style={guideKeywordStyle}>Clear selection</span> - X
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ZoomIn size={14} color={"#766DA7"} /> <span style={guideKeywordStyle}>Zoom</span> - Mouse wheel
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Undo2 size={14} color={"#766DA7"} /> <span style={guideKeywordStyle}>Undo</span> - CTRL + Z
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Redo2 size={14} color={"#766DA7"} /> <span style={guideKeywordStyle}>Redo</span> - CTRL + SHIFT + Z
            </div>
             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Maximize size={14} color={"#766DA7"} /> <span style={guideKeywordStyle}>Fullscreen</span> - F11
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  background: "#f8f8f8",
  border: "1px solid #ccc",
  fontFamily: "'Fredoka', sans-serif",
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
  padding: "6px 10px",
  borderRadius: "4px",
  transition: "background 0.2s",
};

const guideKeywordStyle: React.CSSProperties = {
  color: "#766DA7",
  //fontWeight: "bold",
};
