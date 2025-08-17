// src/components/Canvas/Node/TextNode.tsx
import { useRef, useLayoutEffect, useState } from "react";
import type { NodeProps } from "./Node";
import type {
  TextNode as TextNodeType,
  NodeData,
  SceneNode,
  ChapterNode,
  Story,
} from "../../../context/storyStore/types";
import { baseNodeStyle, miniHeaderStyle } from "./nodeStyles";
import NodeActions from "./NodeActions/NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";
import { useNodeMetricsStore } from "../../../context/uiStore/nodeMetricsStore";
import StickerOverlay from "./StickerOverlay";
import {
  applyTextDeltaWithinChapter,
  findParentSceneId,
  findChapterOfScene,
} from "../../../context/storyStore/layoutShifts";
import { useLayoutStore } from "../../../context/uiStore/layoutStore";


// ---------- color helpers (no visual change)
function resolveColor(input?: string | number): string {
  if (typeof input === "number") return `var(--chapter-color-${input + 1})`;
  if (typeof input === "string" && input.trim()) return input;
  return "var(--chapter-color-1)";
}
const softTint = (color: string, pct = 35) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;


export default function TextNode(
  props: NodeProps & { focusedNodeId?: string }
) {
  const {
    node,
    chapterColor,
    isDragging,
    isInDragGroup,
    onMouseDown,
    onEditNode,
    focusedNodeId,
    isConnectMode,
    isValidConnectTarget,
    isConnectSource,
  } = props;

  const textNode = node as TextNodeType;
  const { stickerBasePath, themeId, mode } = useTheme();

  // colors (same look)
  const resolvedChapterColor = resolveColor(chapterColor as any);
  const glowColor = resolvedChapterColor || "var(--color-accent)";
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // store
  const story = useStoryStore((s) => s.story);
  const setStory = useStoryStore((s) => s.setStory);

  // derive parent scene + chapter from flat store
  const sceneId = findParentSceneId(story, node.id);
  const chapterId = sceneId ? findChapterOfScene(story, sceneId) : null;

  const parentScene = (sceneId ? story.nodeMap[sceneId] : null) as SceneNode | null;
  const parentChapter = (chapterId ? story.nodeMap[chapterId] : null) as ChapterNode | null;

  const nodeRef = useRef<HTMLDivElement>(null);

  // connect-mode visuals
  const dim = props.isConnectMode && !props.isValidConnectTarget && !props.isConnectSource;
  const hilite = props.isConnectMode && props.isValidConnectTarget;

  // metrics + shifting (single observer)
  // flags stored per-node just for the first-time shift (set by actions on create*)
  const needsInitialShift = (textNode as any)?.pendingInitialShift === true;

  // metrics size updater
  const setNodeSize = useNodeMetricsStore((s) => s.setNodeSize);

  // refs for resize-driven shifting
  const prevHeightRef = useRef(0);
  const lastShiftDeltaRef = useRef(0);
  const lastThemeRef = useRef({ themeId, mode });

  const setStoryNoHistory = useStoryStore((s) => s.setStoryNoHistory);
  const suppressAutoLayout = useLayoutStore((s) => s.suppressAutoLayout);



  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const run = () => {
      const newH = el.offsetHeight;

      // always publish live size
      setNodeSize(node.id, { width: el.offsetWidth, height: newH });

      // ⛔ During undo/redo: don't apply any shift deltas, just reset baselines.
      if (suppressAutoLayout) {
        prevHeightRef.current = newH;
        lastShiftDeltaRef.current = 0;
        lastThemeRef.current = { themeId, mode };
        return;
      }

      const prev = prevHeightRef.current;
      const deltaY = newH - prev;

      // First-time shift right after insertion
      if (prev === 0 && needsInitialShift && newH > 0) {
        const s = {
          title: story.title,
          nodeMap: { ...story.nodeMap },
          order: [...story.order],
          childrenOrder: Object.fromEntries(Object.entries(story.childrenOrder).map(([k, v]) => [k, [...(v ?? [])]])),
        } as Story;

        applyTextDeltaWithinChapter(s, node.id, newH);

        // clear the flag on this node
        const n = s.nodeMap[node.id];
        s.nodeMap[node.id] = { ...n, pendingInitialShift: false } as any;

        setStoryNoHistory(s);
        prevHeightRef.current = newH;
        lastShiftDeltaRef.current = newH;
        return;
      }

      // Ignore theme-only relayouts
      if (lastThemeRef.current.themeId !== themeId || lastThemeRef.current.mode !== mode) {
        lastThemeRef.current = { themeId, mode };
        prevHeightRef.current = newH;
        return;
      }

      // Live content growth/shrink
      if (prev > 0 && deltaY !== 0) {
        const s = {
          title: story.title,
          nodeMap: { ...story.nodeMap },
          order: [...story.order],
          childrenOrder: Object.fromEntries(Object.entries(story.childrenOrder).map(([k, v]) => [k, [...(v ?? [])]])),
        } as Story;

        applyTextDeltaWithinChapter(s, node.id, deltaY);
        setStoryNoHistory(s);
        lastShiftDeltaRef.current = deltaY;
      }

      prevHeightRef.current = newH;
    };

    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, node.id, themeId, mode, setNodeSize, needsInitialShift]);


  return (
    <>
      {/* Sticker overlay (decoupled) */}
      <StickerOverlay
        hostRef={nodeRef}
        nodeId={node.id}
        nodePosition={node.position}
        sticker={textNode.sticker as any}
        basePath={stickerBasePath}
      />

      {/* 📝 Main Node */}
      <div
        ref={nodeRef}
        onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
        style={{
          ...baseNodeStyle(isInDragGroup, glowColor),
          position: "absolute",
          background: isFocused ? "var(--color-warningBg)" : "var(--color-bg)",
          borderRadius: "6px",
          top: node.position.y,
          left: node.position.x,
          padding: "8px",
          transition: "box-shadow 0.25s ease",
          zIndex: 100,
          border: "1px solid var(--color-border)",
          opacity: dim ? 0.35 : 1,
          //outline: hilite ? `4px dashed ${resolvedChapterColor}` : undefined,
          outlineOffset: hilite ? 2 : undefined,
          cursor: props.isConnectMode ? (hilite ? "copy" : "not-allowed") : (isDragging ? "grabbing" : "grab"),
          filter: hilite ? "saturate(1.5)" : undefined,
        }}
      >
        <NodeActions nodeId={node.id} onEditNode={onEditNode} />

        {/* Chapter Header (solid) */}
        <div
          style={{
            ...miniHeaderStyle(resolvedChapterColor),
            background: resolvedChapterColor,
            color: "#fff",
          }}
        >
          📄 Chapter: {parentChapter?.title || "(Unknown)"}
        </div>

        {/* Scene Header (soft tint) */}
        <div
          style={{
            ...miniHeaderStyle(resolvedChapterColor),
            background: softTint(resolvedChapterColor, 30),
            color: "var(--color-text)",
          }}
        >
          Scene: {parentScene?.title || "(Unknown)"}
        </div>

        {/* Summary */}
        {textNode.summary && (
          <div
            style={{
              fontWeight: "bold",
              marginTop: "8px",
              marginBottom: "4px",
              color: "var(--color-text)",
            }}
          >
            {textNode.summary}
          </div>
        )}

        {/* Rich text */}
        <div
          style={{ fontSize: "12px", marginBottom: "4px", lineHeight: "1.4", color: "var(--color-text)" }}
          dangerouslySetInnerHTML={{
            __html: textNode.text || "<em>(Empty Node)</em>",
          }}
        />

        {/* Tags */}
        {textNode.tags && textNode.tags.length > 0 && (
          <div style={{ marginTop: "4px", fontSize: "10px", color: "var(--color-mutedText)" }}>
            Tags:{" "}
            {textNode.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  background: "var(--color-panelAlt)",
                  padding: "2px 6px",
                  marginRight: "4px",
                  borderRadius: "4px",
                  fontSize: "10px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
