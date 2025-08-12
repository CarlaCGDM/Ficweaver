// src/components/Canvas/Node/SceneNode.tsx
import { useRef, useLayoutEffect } from "react";
import type { NodeProps } from "./Node";
import type { SceneNode as SceneNodeType, NodeData } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";

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

  // ✅ Colors (unchanged visuals)
  const resolvedChapterColor = resolveColor(chapterColor, "var(--chapter-color-1)");
  const glowColor = resolvedChapterColor;

  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // ✅ FLAT STORE: pull children (texts + media) from childrenOrder / nodeMap
  const story = useStoryStore((s) => s.story);
  const childIds = story.childrenOrder[node.id] ?? [];
  const attachedMedia = childIds
    .map((id) => story.nodeMap[id])
    .filter(
      (n): n is NodeData =>
        !!n && (n.type === "picture" || n.type === "annotation" || n.type === "event")
    );

  // ---- (optional) height-aware shifting was using old helpers; skipping for now
  //      to keep this lean and avoid side-effects until dragging/rehydration is stable.
  const nodeRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    // noop placeholder (keeps your previous measure/ref intact without shifting)
  }, []);

  return (
    <>
      {/* Main Scene Node */}
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
          cursor: isDragging ? "grabbing" : "grab",
          transition: "box-shadow 0.25s ease",
          zIndex: 90,
          position: "absolute",
        }}
      >
        {!isFocused && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: softTint(resolvedChapterColor, 30),
              pointerEvents: "none",
              borderRadius: "6px",
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
            color: "var(--color-text)"
          }}
        >
          🎬 Chapter {chapterIndex !== undefined ? chapterIndex + 1 : "?"}, Scene{" "}
          {sceneIndex !== undefined ? sceneIndex + 1 : "?"}
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

      {/* Attached media (positioned absolutely; visuals unchanged) */}
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
