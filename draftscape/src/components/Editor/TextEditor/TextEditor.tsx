// src/components/Editor/TextEditor/TextEditor.tsx
import { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import type { Story, TextNode as TextNodeType, NodeData } from "../../../context/storyStore/types";
import { editorContainer } from "./textEditorStyles";
import TextEditorHeader from "./TextEditorHeader";
import SearchBar from "./SearchBar";
import TextEditorContent from "./TextEditorContent";
import { safeScrollToCenter } from "../utils/safeScrollToCenter";

export interface TextEditorRef {
  scrollToNode: (nodeId: string) => void;
}

interface TextEditorProps {
  onFocusNode: (nodeId: string) => void;
  focusedNodeId?: string;
}

/* ---------------- helpers for flat structure ---------------- */
const stripHtmlWordCount = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const findAncestorOfType = (story: Story, startId: string, types: Array<NodeData["type"]>) => {
  let cur: string | null = startId;
  while (cur) {
    const n: NodeData | undefined = story.nodeMap[cur];
    if (!n) return null;
    if (types.includes(n.type)) return n.id;
    cur = n.parentId;
  }
  return null;
};

const firstChildOfType = (story: Story, parentId: string, type: NodeData["type"]) => {
  const kids = story.childrenOrder[parentId] ?? [];
  for (const id of kids) {
    const n = story.nodeMap[id];
    if (n && n.type === type) return n.id;
  }
  return null;
};

const firstTextInScene = (story: Story, sceneId: string) => firstChildOfType(story, sceneId, "text");

const firstTextInChapter = (story: Story, chapterId: string) => {
  const sceneIds = story.childrenOrder[chapterId] ?? [];
  for (const scId of sceneIds) {
    const t = firstTextInScene(story, scId);
    if (t) return t;
  }
  return null;
};

/* ------------------------------------------------------------ */

const TextEditor = forwardRef<TextEditorRef, TextEditorProps>(({ onFocusNode, focusedNodeId }, ref) => {
  const story = useStoryStore((state) => state.story);

  const [viewMode, setViewMode] = useState<"text" | "chronology">("text");

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
  const [hoveredChapterId, setHoveredChapterId] = useState<string | null>(null);
  const [hoveredDetails, setHoveredDetails] = useState<any>(null);

  const [focusedSceneId, setFocusedSceneId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusedNodeId) {
      setFocusedSceneId(null);
    }
  }, [focusedNodeId]);

  const [searchResults, setSearchResults] = useState<{
    chapters: string[];
    textNodes: string[];
    eventNodes: string[];
    searchQuery?: string;
  }>({ chapters: [], textNodes: [], eventNodes: [], searchQuery: "" });

  const [searchPerformed, setSearchPerformed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useImperativeHandle(ref, () => ({
    scrollToNode(nodeId: string) {
      const node = story.nodeMap[nodeId];
      if (!node) return;

      let targetNodeId: string | null = null;
      let targetType: "text" | "chapter" | "scene" | "event" | null = null;
      let needsViewModeChange = false;

      if (node.type === "event") {
        // Events → chronology view; focus the scene ancestor if present
        targetNodeId = node.id;
        targetType = "event";
        const sceneAncestor = findAncestorOfType(story, node.id, ["scene"]);
        setFocusedSceneId(sceneAncestor);
        needsViewModeChange = viewMode !== "chronology";
      } else if (node.type === "text") {
        targetNodeId = node.id;
        targetType = "text";
        const sceneAncestor = findAncestorOfType(story, node.id, ["scene"]);
        setFocusedSceneId(sceneAncestor);
        needsViewModeChange = viewMode !== "text";
      } else if (node.type === "scene") {
        // Scroll to first text in this scene (if any)
        const firstText = firstTextInScene(story, node.id);
        targetNodeId = firstText ?? null;
        targetType = "scene";
        setFocusedSceneId(node.id);
        needsViewModeChange = viewMode !== "text";
      } else if (node.type === "chapter") {
        // Scroll to first text under this chapter (if any)
        const firstText = firstTextInChapter(story, node.id);
        targetNodeId = firstText ?? null;
        targetType = "chapter";
        setFocusedSceneId(null);
        needsViewModeChange = viewMode !== "text";
      } else {
        // Media: try to scroll to their text/scene ancestor
        const textAncestor = findAncestorOfType(story, node.id, ["text"]);
        const sceneAncestor = findAncestorOfType(story, node.id, ["scene"]);
        if (textAncestor) {
          targetNodeId = textAncestor;
          targetType = "text";
          setFocusedSceneId(sceneAncestor);
          needsViewModeChange = viewMode !== "text";
        } else if (sceneAncestor) {
          const firstText = firstTextInScene(story, sceneAncestor);
          targetNodeId = firstText ?? null;
          targetType = "scene";
          setFocusedSceneId(sceneAncestor);
          needsViewModeChange = viewMode !== "text";
        }
      }

      const doScroll = () => {
        if (targetNodeId && nodeRefs.current[targetNodeId]) {
          const scroller = containerRef.current;
          const el = nodeRefs.current[targetNodeId]!;
          if (scroller) {
            safeScrollToCenter(scroller, el);
          } else {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn("⚠️ No ref found for:", targetNodeId || nodeId);
        }
      };

      if (needsViewModeChange) {
        const newViewMode = targetType === "event" ? "chronology" : "text";
        setViewMode(newViewMode);
        requestAnimationFrame(() => setTimeout(doScroll, 50));
      } else {
        doScroll();
      }
    },
  }));

  /* ------------------- totals (flat) ------------------- */

  const totalWords = useMemo(() => {
  let sum = 0;
  // ⬇️ Cast
  for (const n of Object.values(story.nodeMap) as NodeData[]) {
    if (n.type === "text") {
      sum += stripHtmlWordCount((n as TextNodeType).text || "");
    }
  }
  return sum;
}, [story.nodeMap]);

  // Accepts either a chapterId (string) or legacy object with .id / .chapterNode.id
  const getChapterWordCount = (chapterLike: any) => {
    const chapterId: string | undefined =
      typeof chapterLike === "string"
        ? chapterLike
        : chapterLike?.id ?? chapterLike?.chapterNode?.id;

    if (!chapterId) return 0;
    const sceneIds = story.childrenOrder[chapterId] ?? [];
    let sum = 0;
    for (const scId of sceneIds) {
      const childIds = story.childrenOrder[scId] ?? [];
      for (const cid of childIds) {
        const n = story.nodeMap[cid];
        if (n?.type === "text") {
          sum += stripHtmlWordCount((n as TextNodeType).text || "");
        }
      }
    }
    return sum;
  };

  /* ----------------------------------------------------- */

  return (
    <div
      ref={containerRef}
      className="text-editor"
      style={editorContainer}
      onMouseLeave={() => {
        setHoveredId(null);
        setHoveredSceneId(null);
        setHoveredChapterId(null);
        setHoveredDetails(null);
      }}
    >

      <SearchBar
        onSearch={(results, reset) => {
          setSearchResults(results);
          setSearchPerformed(!reset);
        }}
      />

      <TextEditorHeader
        totalWords={totalWords}
        viewMode={viewMode}
        onToggleView={() => setViewMode((prev) => (prev === "text" ? "chronology" : "text"))}
      />

      <TextEditorContent
        story={story}
        viewMode={viewMode}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
        hoveredSceneId={hoveredSceneId}
        setHoveredSceneId={setHoveredSceneId}
        hoveredChapterId={hoveredChapterId}
        setHoveredChapterId={setHoveredChapterId}
        setHoveredDetails={setHoveredDetails}
        focusedNodeId={focusedNodeId || null}
        focusedSceneId={focusedSceneId}
        nodeRefs={nodeRefs}
        onFocusNode={onFocusNode}
        searchResults={searchResults}
        searchPerformed={searchPerformed}
        getChapterWordCount={getChapterWordCount}
      />

      <style>
        {`
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .focused-highlight {
            background-color: var(--color-warningBg) !important;
            transition: background-color 0.3s ease;
          }
        `}
      </style>
    </div>
  );
});

export default TextEditor;
