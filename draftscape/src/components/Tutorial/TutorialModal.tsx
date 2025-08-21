import { useEffect, useMemo, useRef, useState } from "react";
import type { TutorialSlide } from "./Slides";
import { defaultSlides } from "./Slides";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/themeProvider/ThemeProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  slides?: TutorialSlide[];
};

export default function TutorialModal({ open, onClose, slides = defaultSlides }: Props) {
  const { theme, mode } = useTheme();
  const [index, setIndex] = useState(0);

  const total = slides.length;
  const current = slides[index];

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, total]);

  useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  if (!open) return null;

  // theme colors
  const accent = theme?.chapterColors?.[mode]?.[0] ?? "var(--color-accent)";
  const panel = "var(--color-panel)";
  const panelAlt = "var(--color-panelAlt)";
  const border = "var(--color-border)";
  const text = "var(--color-text)";
  const muted = "var(--color-mutedText)";
  const bg = "color-mix(in srgb, var(--color-bg) 92%, transparent)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "color-mix(in srgb, var(--color-bg) 60%, transparent)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "6vh",
        zIndex: 4000,
      }}
    >
      <div
        style={{
          width: "min(760px, 92vw)",
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          boxShadow: "var(--node-shadow)",
          color: text,
          overflow: "hidden",
          fontFamily: "var(--font-ui)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: `1px solid ${border}`,
            background: panel,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {current?.icon && (
              <div
                style={{
                  width: 32, height: 32, display: "grid", placeItems: "center",
                  borderRadius: 8, background: accent, color: "var(--color-accentText)"
                }}
              >
                {current.icon}
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 700 }}>{current?.title}</div>
          </div>

          <button
            aria-label="Close tutorial"
            onClick={onClose}
            style={iconBtnStyle}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, display: "grid", gap: 12 }}>
          {current?.imageSrc && (
            <div
              style={{
                background: panelAlt,
                border: `1px solid ${border}`,
                borderRadius: 8,
                overflow: "hidden",
                maxHeight: 240,
                display: "grid",
                placeItems: "center",
              }}
            >
              <img
                src={current.imageSrc}
                alt=""
                style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
              />
            </div>
          )}

          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            {current?.description}
          </div>
        </div>

        {/* Footer / Progress */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            padding: "10px 14px",
            borderTop: `1px solid ${border}`,
            gap: 10,
            background: "var(--color-bg)",
          }}
        >
          {/* Left controls */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              disabled={index === 0}
              style={{ ...pillBtnStyle, opacity: index === 0 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
              disabled={index === total - 1}
              style={{ ...pillBtnStyle, opacity: index === total - 1 ? 0.5 : 1 }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>

          {/* Center progress */}
          <div style={{ textAlign: "center", fontSize: 12, color: muted }}>
            Slide <strong>{index + 1}</strong> of <strong>{total}</strong>
            <div style={{ height: 6, width: 180, background: panelAlt, borderRadius: 999, margin: "6px auto 0" }}>
              <div
                style={{
                  height: "100%",
                  width: `${((index + 1) / total) * 100}%`,
                  background: accent,
                  borderRadius: 999,
                  transition: "width .25s ease",
                }}
              />
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", justifyContent: "end", gap: 8 }}>
            <button onClick={onClose} style={pillBtnStyle}>
              {index === total - 1 ? "Done" : "Skip"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: "grid",
  placeItems: "center",
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "var(--color-panelAlt)",
  color: "var(--color-text)",
  cursor: "pointer",
};

const pillBtnStyle: React.CSSProperties = {
  border: "1px solid var(--color-border)",
  background: "var(--color-panel)",
  color: "var(--color-text)",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
};
