// src/components/Canvas/Node/SceneNode.tsx
import { useRef, useLayoutEffect, useMemo } from "react";
import type { NodeProps } from "./Node";
import type { SceneNode as SceneNodeType, NodeData, Story } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions/NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { useNodeMetricsStore } from "../../../context/uiStore/nodeMetricsStore";
import { useLayoutStore } from "../../../context/uiStore/layoutStore";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";
import { applySceneDeltaWithinChapter } from "../../../context/storyStore/layoutShifts";

/** Accepts string | number | undefined (keeps your tokens working) */
function resolveColor(input: unknown, fallbackVar: string): string {
  if (typeof input === "number") return `var(--chapter-color-${input + 1})`;
  if (typeof input === "string" && input.trim()) return input;
  return fallbackVar;
}

const softTint = (color: string, pct = 16) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function SceneNode(
  props: NodeProps & { focusedNodeId?: string; chapterIndex?: number; sceneIndex?: number }
) {
  const {
    node,
    chapterColor,
    isDragging,
    isInDragGroup,
    onMouseDown,
    onEditNode,
    chapterIndex,
    sceneIndex,
    focusedNodeId,
    isConnectMode,
    isValidConnectTarget,
    isConnectSource,
  } = props;

  const sceneNode = node as SceneNodeType;
  const story = useStoryStore((s) => s.story);

  // 🔢 Derive indices if they weren’t provided
  const { derivedChapterIndex, derivedSceneIndex } = useMemo(() => {
    const parentChapterId = sceneNode.parentId;
    let chIdx: number | undefined;
    let scIdx: number | undefined;

    if (parentChapterId) {
      const i = story.order.indexOf(parentChapterId);
      if (i >= 0) chIdx = i;

      const siblings = (story.childrenOrder[parentChapterId] ?? [])
        .filter((id) => story.nodeMap[id]?.type === "scene");
      const j = siblings.indexOf(sceneNode.id);
      if (j >= 0) scIdx = j;
    }

    return { derivedChapterIndex: chIdx, derivedSceneIndex: scIdx };
  }, [sceneNode.id, sceneNode.parentId, story]);

  // Choose provided prop or fallback
  const chIndexToShow = (chapterIndex ?? derivedChapterIndex) ?? undefined;
  const scIndexToShow = (sceneIndex ?? derivedSceneIndex) ?? undefined;

  // ✅ Colors
  const resolvedChapterColor = resolveColor(chapterColor, "var(--chapter-color-1)");
  const glowColor = resolvedChapterColor;

  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // ✅ FLAT STORE: children (to render media as before)
  const childIds = story.childrenOrder[node.id] ?? [];
  const attachedMedia = childIds
    .map((id) => story.nodeMap[id])
    .filter(
      (n): n is NodeData =>
        !!n && (n.type === "picture" || n.type === "annotation" || n.type === "event")
    );

  // ✅ publish size + shift-on-resize (same pattern as TextNode)
  const nodeRef = useRef<HTMLDivElement>(null);
  const setNodeSize = useNodeMetricsStore((s) => s.setNodeSize);
  const setStoryNoHistory = useStoryStore((s) => s.setStoryNoHistory);
  const suppressAutoLayout = useLayoutStore((s) => s.suppressAutoLayout);
  const { themeId, mode } = useTheme();

  const prevHeightRef = useRef(0);
  const lastShiftDeltaRef = useRef(0);
  const lastThemeRef = useRef({ themeId, mode });

  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const run = () => {
      const newH = el.offsetHeight;

      // Always publish live size
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

      // Ignore theme-only relayouts
      if (lastThemeRef.current.themeId !== themeId || lastThemeRef.current.mode !== mode) {
        lastThemeRef.current = { themeId, mode };
        prevHeightRef.current = newH;
        return;
      }

      // Shift siblings (and their descendants) within the same chapter on size change
      if (prev > 0 && deltaY !== 0) {
        console.log("size changed! shifting siblings and descendants!")
        const s: Story = {
          title: story.title,
          nodeMap: { ...story.nodeMap },
          order: [...story.order],
          childrenOrder: Object.fromEntries(
            Object.entries(story.childrenOrder).map(([k, v]) => [k, [...(v ?? [])]])
          ),
        };

        applySceneDeltaWithinChapter(s, sceneNode.id, deltaY);
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
  }, [story, node.id, themeId, mode, setNodeSize, suppressAutoLayout]);

  const dim = isConnectMode && !isValidConnectTarget && !isConnectSource;
  const hilite = isConnectMode && isValidConnectTarget;

  return (
    <>
      <div
        ref={nodeRef}
        data-node-id={node.id}
        onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
        style={{
          ...baseStyle,
          background: isFocused ? "var(--color-warningBg)" : "var(--color-bg)",
          border: "1px solid var(--color-border)",
          top: node.position.y,
          left: node.position.x,
          transition: "box-shadow 0.25s ease",
          zIndex: 90,
          position: "absolute",
          opacity: dim ? 0.35 : 1,
          // outline: hilite ? `4px dashed ${resolvedChapterColor}` : undefined,
          outlineOffset: hilite ? 2 : undefined,
          cursor: isConnectMode ? (hilite ? "copy" : "not-allowed") : (isDragging ? "grabbing" : "grab"),
          filter: hilite ? "saturate(1.5)" : undefined,
        }}
      >
        {!isFocused && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: softTint(resolvedChapterColor, 30),
              pointerEvents: "none",
              borderRadius: "5px",
              zIndex: 0,
            }}
          />
        )}

        <NodeActions nodeId={node.id} onEditNode={onEditNode} />

        <div
          style={{
            ...headerStyle("transparent"),
            position: "relative",
            zIndex: 1,
            color: "var(--color-text)",
          }}
        >
          🎬 Chapter {chIndexToShow !== undefined ? chIndexToShow + 1 : "?"}, Scene{" "}
          {scIndexToShow !== undefined ? scIndexToShow + 1 : "?"}
        </div>

        <div style={{ padding: "14px 8px", position: "relative", zIndex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px", color: "var(--color-text)" }}>
            {sceneNode.title}
          </div>
          {sceneNode.description && (
            <div style={{ fontSize: "12px", color: "var(--color-text)" }}>
              {sceneNode.description}
            </div>
          )}
        </div>
      </div>

      {/* Attached media (unchanged) */}
      {attachedMedia.map((media) => (
        <div
          key={media.id}
          style={{
            position: "absolute",
            top: media.position.y,
            left: media.position.x,
            zIndex: 95,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
