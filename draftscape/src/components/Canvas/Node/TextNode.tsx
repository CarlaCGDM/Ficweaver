import { useRef, useLayoutEffect, useState } from "react";
import type { NodeProps } from "./Node";
import type { TextNode as TextNodeType } from "../../../context/storyStore/types";
import { baseNodeStyle, miniHeaderStyle } from "./nodeStyles";
import NodeActions from "./NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { shiftNodes, collectShiftGroup } from "../../../context/storyStore/helpers";

export default function TextNode({
  node,
  parentChapterId,
  parentSceneId,
  chapterColor,
  sceneColor,
  isDragging,
  isInDragGroup,
  onMouseDown,
  onEditNode,
  focusedNodeId,
}: NodeProps & { focusedNodeId?: string }) {
  const textNode = node as TextNodeType;
  const sticker = textNode.sticker;
  const glowColor = chapterColor || "#007BFF";
  const isFocused = focusedNodeId === node.id;

  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  const story = useStoryStore((state) => state.story);

  const parentChapter = story.chapters.find((ch) => ch.id === parentChapterId);
  const parentScene = parentChapter?.scenes.find((sc) => sc.id === parentSceneId);

  // ✅ Track node size (width & height)
  const nodeRef = useRef<HTMLDivElement>(null);
  const [nodeSize, setNodeSize] = useState({ width: 0, height: 0 });
  const prevHeightRef = useRef(0);
  const lastShiftDeltaRef = useRef(0);

  useLayoutEffect(() => {
    if (!nodeRef.current) return;

    const updateSize = () => {
      const el = nodeRef.current!;
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      setNodeSize({ width, height });

      const prevHeight = prevHeightRef.current;
      const deltaY = height - prevHeight;

      // ✅ Undo/Redo Guard: Skip if reversing a previous shift
      if (prevHeight > 0 && deltaY !== 0) {
        // if it's literally undo or redo of the same change, skip shifting
        if (Math.abs(deltaY) === Math.abs(lastShiftDeltaRef.current)) {
          prevHeightRef.current = height;
          return;
        }

        // ✅ Perform normal shifting
        const storyCopy = { ...story };

        // 1️⃣ Shift subsequent nodes in the same scene
        const chapter = storyCopy.chapters.find((ch) => ch.id === parentChapterId);
        if (!chapter) return;
        const scene = chapter.scenes.find((sc) => sc.id === parentSceneId);
        if (!scene) return;

        const nodeIndex = scene.nodes.findIndex((n) => n.id === node.id);
        scene.nodes.slice(nodeIndex + 1).forEach((n) => {
          if (n.type === "picture" || n.type === "annotation") return;
          const group = collectShiftGroup(storyCopy, n.id);
          shiftNodes(storyCopy, group, { x: 0, y: deltaY });
        });

        // 2️⃣ Shift subsequent scenes in the same chapter
        const sceneIndex = chapter.scenes.findIndex((sc) => sc.id === parentSceneId);
        chapter.scenes.slice(sceneIndex + 1).forEach((sc) => {
          const group = collectShiftGroup(storyCopy, sc.nodes[0].id);
          shiftNodes(storyCopy, group, { x: 0, y: deltaY });
        });

        // 3️⃣ Shift subsequent chapters
        const chapterIndex = storyCopy.chapters.findIndex((ch) => ch.id === parentChapterId);
        storyCopy.chapters.slice(chapterIndex + 1).forEach((subCh) => {
          const group = collectShiftGroup(storyCopy, subCh.chapterNode.id);
          shiftNodes(storyCopy, group, { x: 0, y: deltaY });
        });

        useStoryStore.setState({ story: storyCopy });
        lastShiftDeltaRef.current = deltaY;
      }

      prevHeightRef.current = height;
    };

    updateSize(); // Initial measure

    const observer = new ResizeObserver(updateSize);
    observer.observe(nodeRef.current);

    return () => observer.disconnect();
  }, [story, parentChapterId, parentSceneId, node.id]);

  return (
    <>
      {/* Sticker Layer */}
      {sticker && (
        <div
          style={{
            position: "absolute",
            top: node.position.y - 50,
            left: node.position.x - 50,
            width: nodeSize.width + 100,
            height: nodeSize.height + 100,
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          <img
            src={`/src/assets/stickers/flowers/${String(sticker.imageIndex).padStart(2, "0")}.png`}
            alt="Sticker"
            style={{
              position: "absolute",
              width: "100px",
              height: "100px",
              pointerEvents: "none",
              ...(sticker.corner === "top-left" && { top: 0, left: 0 }),
              ...(sticker.corner === "top-right" && { top: 0, right: 0 }),
              ...(sticker.corner === "bottom-left" && { bottom: 0, left: 0 }),
              ...(sticker.corner === "bottom-right" && { bottom: 0, right: 0 }),
            }}
          />
        </div>
      )}

      {/* 📝 Main Node */}
      <div
        ref={nodeRef}
        onMouseDown={(e) => onMouseDown(e, node.id, node.position.x, node.position.y)}
        style={{
          ...baseStyle,
          position: "absolute",
          background: isFocused ? "rgb(255, 240, 189)" : "white",
          borderRadius: "6px",
          top: node.position.y,
          left: node.position.x,
          cursor: isDragging ? "grabbing" : "grab",
          padding: "8px",
          transition: "box-shadow 0.25s ease",
          zIndex: 100,
        }}
      >
        <NodeActions nodeId={node.id} onEditNode={onEditNode} />

        {/* Chapter Header */}
        <div
          style={{
            ...miniHeaderStyle(chapterColor || "#fdf3d0"),
            background: chapterColor || "#fdf3d0",
            color: "white",
          }}
        >
          📄 Chapter: {parentChapter?.title || "(Unknown)"}
        </div>

        {/* Scene Header */}
        <div
          style={{
            ...miniHeaderStyle(sceneColor || "#e3f2fd"),
            background: `${sceneColor}44`,
            color: "#222",
          }}
        >
          Scene: {parentScene?.title || "(Unknown)"}
        </div>

        {/* Summary */}
        {textNode.summary && (
          <div style={{ fontWeight: "bold", marginTop: "4px", marginBottom: "4px" }}>
            {textNode.summary}
          </div>
        )}

        {/* Rich Text Body */}
        <div
          style={{ fontSize: "12px", marginBottom: "4px", lineHeight: "1.4" }}
          dangerouslySetInnerHTML={{
            __html: textNode.text || "<em>(Empty Node)</em>",
          }}
        />

        {/* Tags */}
        {textNode.tags && textNode.tags.length > 0 && (
          <div style={{ marginTop: "4px", fontSize: "10px", color: "#666" }}>
            Tags:{" "}
            {textNode.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  background: "#eee",
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
