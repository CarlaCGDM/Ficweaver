import type { NodeProps } from "./Node";
import type { ChapterNode as ChapterNodeType, NodeData } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions/NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { useNodeMetricsStore } from "../../../context/uiStore/nodeMetricsStore";
import { useRef, useLayoutEffect, useRef as useRefType } from "react";
import { applyChapterDelta } from "../../../context/storyStore/layoutShifts";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";
import { useLayoutStore } from "../../../context/uiStore/layoutStore";

/** Normalize chapter color */
function resolveChapterColor(input?: string | number): string {
  if (typeof input === "number") return `var(--chapter-color-${input + 1})`;
  if (typeof input === "string" && input.trim()) return input;
  return "var(--chapter-color-1)";
}

// Make a soft tint that works with CSS vars
const softTint = (color: string, pct = 20) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function ChapterNode(
  props: NodeProps & { focusedNodeId?: string; chapterIndex?: number }) {

  const {
    node,
    chapterColor,
    isDragging,
    isInDragGroup,
    onMouseDown,
    onEditNode,
    chapterIndex,
    focusedNodeId,
    isConnectMode,
    isValidConnectTarget,
    isConnectSource
  } = props;

  const chapterNode = node as ChapterNodeType;
  const resolvedChapterColor = resolveChapterColor(chapterColor);
  const glowColor = resolvedChapterColor || "var(--color-accent)";
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  const { themeId, mode } = useTheme(); // guard against theme-driven relayouts
  const suppressAutoLayout = useLayoutStore((s) => s.suppressAutoLayout);

  // ✅ Access story and get children from flat structure
  const story = useStoryStore((state) => state.story);
  const setStoryNoHistory = useStoryStore((s) => s.setStoryNoHistory);

  // Children of this chapter (scenes, media, etc.)
  const childIds = story.childrenOrder[node.id] ?? [];
  const attachedMedia = childIds
    .map((id) => story.nodeMap[id])
    .filter(
      (n): n is NodeData =>
        !!n &&
        (n.type === "picture" || n.type === "annotation" || n.type === "event")
    );


  // metrics + measurement
  const setNodeSize = useNodeMetricsStore((s) => s.setNodeSize);
  const nodeRef = useRef<HTMLDivElement>(null);

  // track for delta-based shifts
  const prevHeightRef = useRef(0);
  const lastShiftDeltaRef = useRef(0);
  const lastThemeRef = useRef({ themeId, mode });

  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const run = () => {
      const newH = el.offsetHeight;

      // always publish metrics
      setNodeSize(node.id, { width: el.offsetWidth, height: newH });

      // pause auto layout during undo/redo
      if (suppressAutoLayout) {
        prevHeightRef.current = newH;
        lastShiftDeltaRef.current = 0;
        lastThemeRef.current = { themeId, mode };
        return;
      }

      const prev = prevHeightRef.current;
      const deltaY = newH - prev;

      // ignore theme-only relayouts
      if (lastThemeRef.current.themeId !== themeId || lastThemeRef.current.mode !== mode) {
        lastThemeRef.current = { themeId, mode };
        prevHeightRef.current = newH;
        return;
      }

      if (prev > 0 && deltaY !== 0) {
        const s: typeof story = {
          title: story.title,
          nodeMap: { ...story.nodeMap },
          order: [...story.order],
          childrenOrder: Object.fromEntries(
            Object.entries(story.childrenOrder).map(([k, v]) => [k, [...(v ?? [])]])
          ),
        };

        // shift this chapter’s *children* by deltaY (scenes and everything under them)
        applyChapterDelta(s, node.id, deltaY);

        setStoryNoHistory(s);
        lastShiftDeltaRef.current = deltaY;
      }

      prevHeightRef.current = newH;
    };

    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => ro.disconnect();
  }, [story, node.id, setNodeSize, themeId, mode, suppressAutoLayout, setStoryNoHistory]);

  // connect
  const dim = isConnectMode && !isValidConnectTarget && !isConnectSource;
  const hilite = isConnectMode && isValidConnectTarget;

  return (
    <>
      <div
        data-node-id={node.id}
        ref={nodeRef}
        onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
        style={{
          ...baseStyle,
          background: isFocused ? "var(--color-warningBg)" : "var(--color-bg)",
          border: "1px solid var(--color-border)",
          top: node.position.y,
          left: node.position.x,
          transition: "box-shadow 0.25s ease",
          zIndex: 80,
          position: "absolute",
          opacity: dim ? 0.35 : 1,
          //outline: hilite ? `4px dashed ${resolvedChapterColor}` : undefined,
          outlineOffset: hilite ? 2 : undefined,
          cursor: props.isConnectMode ? (hilite ? "copy" : "not-allowed") : (isDragging ? "grabbing" : "grab"),
          filter: hilite ? "saturate(1.5)" : undefined,
        }}
      >
        {/* Subtle color wash */}
        {!isFocused && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: softTint(resolvedChapterColor, 20),
              pointerEvents: "none",
              borderRadius: "5px",
              zIndex: 0,
            }}
          />
        )}

        <NodeActions nodeId={node.id} onEditNode={onEditNode} />

        <div
          style={{
            ...headerStyle(resolvedChapterColor),
            position: "relative",
            zIndex: 1,
          }}
        >
          📘 Chapter {chapterIndex !== undefined ? chapterIndex + 1 : "?"}
        </div>

        <div style={{ padding: "14px 8px", position: "relative", zIndex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{chapterNode.title}</div>
          {chapterNode.description && (
            <div style={{ fontSize: "12px", color: "var(--color-text)" }}>
              {chapterNode.description}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Render attached media nodes */}
      {attachedMedia.map((media) => (
        <div
          key={media.id}
          style={{
            position: "absolute",
            top: media.position.y,
            left: media.position.x,
            zIndex: 85,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
