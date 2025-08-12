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
import NodeActions from "./NodeActions";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";

// ---------- color helpers (no visual change)
function resolveColor(input?: string | number): string {
  if (typeof input === "number") return `var(--chapter-color-${input + 1})`;
  if (typeof input === "string" && input.trim()) return input;
  return "var(--chapter-color-1)";
}
const softTint = (color: string, pct = 35) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// ---------- flat-store helpers
function findParentSceneId(story: Story, nodeId: string): string | null {
  // find a key in childrenOrder where the array contains nodeId AND that key is a scene
  for (const [parentId, childIds] of Object.entries(story.childrenOrder)) {
    if (childIds?.includes(nodeId)) {
      const parent = story.nodeMap[parentId];
      if (parent && parent.type === "scene") return parentId;
    }
  }
  return null;
}

function findChapterOfScene(story: Story, sceneId: string): string | null {
  // find chapter whose childrenOrder includes this sceneId
  for (const chId of story.order) {
    const kids = story.childrenOrder[chId] ?? [];
    if (kids.includes(sceneId)) return chId;
  }
  return null;
}

function subsequentIds<T extends string>(arr: T[], id: T): T[] {
  const idx = arr.indexOf(id);
  return idx >= 0 ? arr.slice(idx + 1) : [];
}

export default function TextNode(
  props: NodeProps & { focusedNodeId?: string }
) {
  const {
    node,
    parentChapterId: _legacyParentChapterId, // unused in flat model
    parentSceneId: _legacyParentSceneId,     // unused in flat model
    chapterColor,
    isDragging,
    isInDragGroup,
    onMouseDown,
    onEditNode,
    focusedNodeId,
  } = props;

  const textNode = node as TextNodeType;
  const { stickerBasePath, themeId, mode } = useTheme();

  // colors (same look)
  const resolvedChapterColor = resolveColor(chapterColor as any);
  const glowColor = resolvedChapterColor || "var(--color-accent)";
  const isFocused = focusedNodeId === node.id;
  const baseStyle = baseNodeStyle(isInDragGroup, glowColor);

  const story = useStoryStore((s) => s.story);
  const setStory = useStoryStore((s) => s.setStory);

  // derive parent scene + chapter from flat store
  const sceneId = findParentSceneId(story, node.id);
  const chapterId = sceneId ? findChapterOfScene(story, sceneId) : null;

  const parentScene = (sceneId ? story.nodeMap[sceneId] : null) as SceneNode | null;
  const parentChapter = (chapterId ? story.nodeMap[chapterId] : null) as ChapterNode | null;

  // sticker availability
  const [stickerExists, setStickerExists] = useState(true);

  // measure & shift logic
  const nodeRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);
  const lastShiftDeltaRef = useRef(0);
  const lastThemeRef = useRef({ themeId, mode });
  const lastTextRef = useRef(textNode.text);

  // connect
  const dim = props.isConnectMode && !props.isValidConnectTarget;
  const hilite = props.isConnectMode && props.isValidConnectTarget;

  useLayoutEffect(() => {
    if (!nodeRef.current) return;

    const updateSize = () => {
      const el = nodeRef.current!;
      const newHeight = el.offsetHeight;
      const prevHeight = prevHeightRef.current;
      const deltaY = newHeight - prevHeight;

      // Avoid shifting on theme/font changes (layout-only)
      if (lastThemeRef.current.themeId !== themeId || lastThemeRef.current.mode !== mode) {
        lastThemeRef.current = { themeId, mode };
        prevHeightRef.current = newHeight;
        return;
      }

      // Only shift when actual content height changes (and not repeating last delta)
      if (prevHeight > 0 && deltaY !== 0) {
        if (Math.abs(deltaY) === Math.abs(lastShiftDeltaRef.current)) {
          prevHeightRef.current = newHeight;
          return;
        }

        // Build a shallow copy we can mutate safely
        const s: Story = {
          title: story.title,
          nodeMap: { ...story.nodeMap },
          order: [...story.order],
          childrenOrder: Object.fromEntries(
            Object.entries(story.childrenOrder).map(([k, v]) => [k, [...(v ?? [])]])
          ),
        };

        // 1) shift subsequent TEXT siblings in the same scene
        if (sceneId) {
          const siblings = s.childrenOrder[sceneId] ?? [];
          const after = subsequentIds(siblings, node.id);
          for (const sibId of after) {
            const sib = s.nodeMap[sibId];
            if (sib && sib.type === "text") {
              s.nodeMap[sibId] = {
                ...sib,
                position: { x: sib.position.x, y: sib.position.y + deltaY },
              };
            }
          }
        }

        // 2) shift subsequent SCENES within chapter (all nodes in those scenes move down)
        if (chapterId) {
          const scenesInChapter = s.childrenOrder[chapterId] ?? [];
          const afterScenes = sceneId ? subsequentIds(scenesInChapter, sceneId) : [];
          for (const scId of afterScenes) {
            const childIds = s.childrenOrder[scId] ?? [];
            for (const cid of childIds) {
              const child = s.nodeMap[cid];
              if (!child) continue;
              s.nodeMap[cid] = {
                ...child,
                position: { x: child.position.x, y: child.position.y + deltaY },
              };
            }
          }
        }

        // 3) shift subsequent CHAPTERS (their chapter node + all scenes + all children)
        if (chapterId) {
          const afterChapters = subsequentIds(s.order, chapterId);
          for (const chId of afterChapters) {
            const chNode = s.nodeMap[chId];
            if (chNode && chNode.type === "chapter") {
              s.nodeMap[chId] = {
                ...chNode,
                position: { x: chNode.position.x, y: chNode.position.y + deltaY },
              };
            }
            const scenesOfCh = s.childrenOrder[chId] ?? [];
            for (const scId of scenesOfCh) {
              const scChildren = s.childrenOrder[scId] ?? [];
              for (const cid of scChildren) {
                const c = s.nodeMap[cid];
                if (!c) continue;
                s.nodeMap[cid] = {
                  ...c,
                  position: { x: c.position.x, y: c.position.y + deltaY },
                };
              }
            }
          }
        }

        setStory(s); // respects your undo history unless skipHistory is true
        lastShiftDeltaRef.current = deltaY;
      }

      prevHeightRef.current = newHeight;
    };

    // initial measure + observe
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(nodeRef.current);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, node.id, sceneId, chapterId, themeId, mode]);

  return (
    <>
      {/* Sticker Layer (unchanged visuals) */}
      {textNode.sticker && stickerExists && (
        <div
          style={{
            position: "absolute",
            top: node.position.y - 50,
            left: node.position.x - 50,
            width: (nodeRef.current?.offsetWidth ?? 0) + 100,
            height: (nodeRef.current?.offsetHeight ?? 0) + 100,
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          <img
            src={`${stickerBasePath}/${String(textNode.sticker.imageIndex).padStart(2, "0")}.png`}
            alt="Sticker"
            onError={() => setStickerExists(false)}
            style={{
              position: "absolute",
              width: "100px",
              height: "100px",
              pointerEvents: "none",
              ...(textNode.sticker.corner === "top-left" && { top: 0, left: 0 }),
              ...(textNode.sticker.corner === "top-right" && { top: 0, right: 0 }),
              ...(textNode.sticker.corner === "bottom-left" && { bottom: 0, left: 0 }),
              ...(textNode.sticker.corner === "bottom-right" && { bottom: 0, right: 0 }),
            }}
          />
        </div>
      )}

      {/* 📝 Main Node (same styles) */}
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
  outline: hilite ? "2px dashed var(--color-accent)" : undefined,
  outlineOffset: hilite ? 2 : undefined,
  cursor: props.isConnectMode ? (hilite ? "copy" : "not-allowed") : (isDragging ? "grabbing" : "grab"),
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
