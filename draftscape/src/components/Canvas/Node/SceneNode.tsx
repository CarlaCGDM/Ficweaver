import { useRef, useLayoutEffect } from "react";
import type { NodeProps } from "./Node";
import type { SceneNode as SceneNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle, headerStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { shiftNodes, collectShiftGroup } from "../../../context/storyStore/helpers";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";

// Accepts string | number | undefined without upsetting TS
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
    sceneColor,
    isDragging,
    isInDragGroup,
    onMouseDown,
    onEditNode,
    chapterIndex,
    sceneIndex,
    focusedNodeId,
  } = props;

  const sceneNode = node as SceneNodeType;

  // Normalize colors
  const resolvedChapterColor = resolveColor(chapterColor, "var(--chapter-color-1)");
  const resolvedSceneColor   = resolveColor(sceneColor ?? chapterColor, resolvedChapterColor);

  const glowColor = resolvedChapterColor;
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  // Access story
  const story = useStoryStore((state) => state.story);

  // Figure out parent chapter + scene from IDs already used elsewhere
  const parentChapterId = (props as any).parentChapterId as string | undefined;
  const parentChapter = story.chapters.find((ch) => ch.id === parentChapterId);
  const parentScene = parentChapter?.scenes.find((sc) =>
    sc.nodes.some((n) => n.id === node.id)
  );

  const attachedMedia =
    parentScene?.nodes.filter(
      (n) =>
        (n.type === "picture" || n.type === "annotation" || n.type === "event") &&
        n.connectedTo === node.id
    ) || [];

  // ===============================
  // Resize-based shifting (theme-safe)
  // ===============================
  const { themeId, mode } = useTheme();
  const nodeRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);
  const lastShiftDeltaRef = useRef(0);
  const lastThemeRef = useRef({ themeId, mode });
  const lastDescriptionRef = useRef(sceneNode.description);

  useLayoutEffect(() => {
    if (!nodeRef.current) return;
    if (lastDescriptionRef.current === sceneNode.description) return;

    const updateSize = () => {
      const el = nodeRef.current!;
      const height = el.offsetHeight;
      const prevHeight = prevHeightRef.current;
      const deltaY = height - prevHeight;

      // If the theme/mode changed, treat this as a visual change only.
      if (
        lastThemeRef.current.themeId !== themeId ||
        lastThemeRef.current.mode !== mode
      ) {
        lastThemeRef.current = { themeId, mode };
        prevHeightRef.current = height;
        return; // 🔒 don't shift on theme/font changes
      }

      // Only act on real changes, and avoid echoing the last delta we just produced
      if (prevHeight > 0 && deltaY !== 0) {
        if (Math.abs(deltaY) === Math.abs(lastShiftDeltaRef.current)) {
          prevHeightRef.current = height;
          return;
        }

        const storyCopy = { ...story };

        // 1) Shift subsequent nodes in the same scene (after this scene node)
        if (parentChapter && parentScene) {
          const scene = storyCopy.chapters
            .find((ch) => ch.id === parentChapter.id)!
            .scenes.find((sc) => sc.id === parentScene.id)!;

          const sceneNodeIndex = scene.nodes.findIndex((n) => n.id === node.id);
          scene.nodes.slice(sceneNodeIndex + 1).forEach((n) => {
            // media nodes are allowed to stay; we still shift them if they are linked in the group
            const group = collectShiftGroup(storyCopy, n.id);
            shiftNodes(storyCopy, group, { x: 0, y: deltaY });
          });
        }

        // 2) Shift subsequent scenes in the same chapter
        if (parentChapter && parentScene) {
          const ch = storyCopy.chapters.find((c) => c.id === parentChapter.id)!;
          const sceneIdx = ch.scenes.findIndex((sc) => sc.id === parentScene.id);
          ch.scenes.slice(sceneIdx + 1).forEach((sc) => {
            if (!sc.nodes.length) return;
            const group = collectShiftGroup(storyCopy, sc.nodes[0].id);
            shiftNodes(storyCopy, group, { x: 0, y: deltaY });
          });
        }

        // 3) Shift subsequent chapters
        if (parentChapter) {
          const chapterIndexInStory = storyCopy.chapters.findIndex(
            (ch) => ch.id === parentChapter.id
          );
          storyCopy.chapters.slice(chapterIndexInStory + 1).forEach((subCh) => {
            const group = collectShiftGroup(storyCopy, subCh.chapterNode.id);
            shiftNodes(storyCopy, group, { x: 0, y: deltaY });
          });
        }

        useStoryStore.setState({ story: storyCopy });
        lastShiftDeltaRef.current = deltaY;
      }

      prevHeightRef.current = height;
    };

    // Initial measure + observe
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(nodeRef.current);

    return () => ro.disconnect();
  }, [story, parentChapterId, node.id, themeId, mode]);

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
        {/* Subtle color wash like ChapterNode (only when not focused) */}
        {!isFocused && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: softTint(resolvedSceneColor, 16),
              pointerEvents: "none",
              borderRadius: "6px",
              zIndex: 0,
            }}
          />
        )}

        <NodeActions nodeId={node.id} onEditNode={onEditNode} />

        {/* Header uses the resolved scene color */}
        <div
          style={{
            ...headerStyle(resolvedSceneColor),
            position: "relative",
            zIndex: 1,
          }}
        >
          🎬 Chapter {chapterIndex !== undefined ? chapterIndex + 1 : "?"}, Scene{" "}
          {sceneIndex !== undefined ? sceneIndex + 1 : "?"}
        </div>

        {/* Body */}
        <div style={{ padding: "8px", position: "relative", zIndex: 1 }}>
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

      {/* Render Attached Media (pictures & annotations & events) */}
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
