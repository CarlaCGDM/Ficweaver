// src/components/Canvas/Node/SceneNode.tsx
import { useRef, useLayoutEffect, useMemo } from "react";
import type { NodeProps } from "./Node";
import type { SceneNode as SceneNodeType, NodeData } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";

// ⬇️ NEW: metrics store import
import { useNodeMetricsStore } from "../../../context/uiStore/nodeMetricsStore";

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
  } = props;

  const sceneNode = node as SceneNodeType;
  const story = useStoryStore((s) => s.story);

  // 🔢 Derive indices if they weren’t provided
  const { derivedChapterIndex, derivedSceneIndex } = useMemo(() => {
    // parent chapter is stored on the scene in flat model
    const parentChapterId = sceneNode.parentId;
    let chIdx: number | undefined = undefined;
    let scIdx: number | undefined = undefined;

    if (parentChapterId) {
      // chapter index from story.order
      const i = story.order.indexOf(parentChapterId);
      if (i >= 0) chIdx = i;

      // scene index among chapter’s scenes
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

  // ✅ Colors (unchanged visuals)
  const resolvedChapterColor = resolveColor(chapterColor, "var(--chapter-color-1)");
  const glowColor = resolvedChapterColor;

  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // ✅ FLAT STORE: pull children (texts + media) from childrenOrder / nodeMap
  const childIds = story.childrenOrder[node.id] ?? [];
  const attachedMedia = childIds
    .map((id) => story.nodeMap[id])
    .filter(
      (n): n is NodeData =>
        !!n && (n.type === "picture" || n.type === "annotation" || n.type === "event")
    );

  // publish size to metrics store (unchanged)
  const setNodeSize = useNodeMetricsStore((s) => s.setNodeSize);
  const nodeRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    const report = () => setNodeSize(node.id, { width: el.offsetWidth, height: el.offsetHeight });
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [node.id, setNodeSize]);

  const dim = props.isConnectMode && !props.isValidConnectTarget;
  const hilite = props.isConnectMode && props.isValidConnectTarget;

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
          outline: hilite ? `4px dashed ${resolvedChapterColor}` : undefined,
          outlineOffset: hilite ? 2 : undefined,
          cursor: props.isConnectMode ? (hilite ? "copy" : "not-allowed") : (isDragging ? "grabbing" : "grab"),
          filter: hilite ? "brightness(1.25)" : undefined,
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
