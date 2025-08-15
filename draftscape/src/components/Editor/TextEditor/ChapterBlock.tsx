// src/components/Editor/TextEditor/ChapterBlock.tsx
import { hoverSummaryStyle, chapterTitleStyle } from "./textEditorStyles";
import SceneBlock from "./SceneBlock";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";
import type { ChapterNode, NodeData } from "../../../context/storyStore/types";
import { Copy } from "lucide-react";
import {
  copyHtmlAndText,
  buildChapterExportHtml,
  type ChapterLikeForCopy,
} from "./utils/copyChapterToClipboard"

/** Flat-model chapter-like shape produced by TextEditorContent */
export type ChapterLike = {
  id: string;
  chapterNode: ChapterNode;
  scenes: Array<{
    id: string;
    title?: string;
    description?: string;
    nodes: NodeData[]; // text + media mixed, SceneBlock filters what it needs
  }>;
};

interface ChapterBlockProps {
  chapter: ChapterLike;
  index: number;
  onFocusNode: (nodeId: string) => void;

  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  hoveredChapterId: string | null;
  setHoveredChapterId: (id: string | null) => void;
  hoveredSceneId: string | null;
  setHoveredSceneId: (id: string | null) => void;
  setHoveredDetails: (details: any) => void;

  /** Accepts either chapter-like object or chapterId (your getChapterWordCount already supports both) */
  getChapterWordCount: (ch: any) => number;

  nodeRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  focusedNodeId: string | null;
  focusedSceneId: string | null;

  searchResults?: { chapters: string[]; textNodes: string[] };
  searchQuery?: string;
}

export default function ChapterBlock({
  chapter,
  index,
  onFocusNode,
  hoveredId,
  setHoveredId,
  hoveredChapterId,
  setHoveredChapterId,
  hoveredSceneId,
  setHoveredSceneId,
  setHoveredDetails,
  getChapterWordCount,
  nodeRefs,
  focusedNodeId,
  focusedSceneId,
  searchResults,
  searchQuery = "",
}: ChapterBlockProps) {
  const chapterWordCount = getChapterWordCount(chapter);

  // Theme color (mirror Canvas): derive color by chapter index
  const { theme, mode } = useTheme();
  const palette: string[] = theme.chapterColors?.[mode] ?? [];
  const colorIdx = palette.length ? index % palette.length : index;
  const chapterColor =
    palette[colorIdx] ?? `var(--chapter-color-${(colorIdx % 6) + 1})`;

  const isChapterVisible =
    !searchResults?.chapters?.length || searchResults.chapters.includes(chapter.id);
  if (!isChapterVisible) return null;

  const handleCopyChapter = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { html, text } = buildChapterExportHtml(chapter as ChapterLikeForCopy, index);
    await copyHtmlAndText(html, text);
    // swap with your toast/snackbar if you have one
    alert("Chapter copied to clipboard ✅");
  };


  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Chapter Title with ref and focus highlight */}
      <div
        ref={(el) => {
          nodeRefs.current[chapter.chapterNode.id] = el;
        }}
        className={focusedNodeId === chapter.chapterNode.id ? "focused-highlight" : ""}
        style={{ ...chapterTitleStyle(chapterColor, hoveredId === chapter.id), position: "relative" }}
        onClick={() => onFocusNode(chapter.chapterNode.id)}
        onMouseEnter={() => {
          setHoveredId(chapter.id);
          setHoveredChapterId(chapter.id);
          setHoveredSceneId(null);
          setHoveredDetails({
            textSummary: chapter.chapterNode.description || "(No summary)",
          });
        }}
        onMouseLeave={() => {
          setHoveredId(null);
          setHoveredChapterId(null);
          setHoveredSceneId(null);
          setHoveredDetails(null);
        }}
      >
        {/* Copy (visible on hover) */}
        <button
          onClick={handleCopyChapter}
          title="Copy chapter to clipboard"
          aria-label="Copy chapter to clipboard"
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            height: 28,
            width: 28,
            borderRadius: "50%",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg)",
            display: hoveredId === chapter.id ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--node-shadow)",
            cursor: "pointer",
            color: "var(--color-text)",
          }}
        >
          <Copy size={16} />
        </button>

        <h2 style={{ margin: 0 }}>
          📘 Chapter {index + 1}: {chapter.chapterNode.title}
        </h2>
        <div style={{ fontSize: "12px", marginTop: "4px" }}>({chapterWordCount} words)</div>
        {hoveredId === chapter.id && (
          <div style={hoverSummaryStyle()}>
            {chapter.chapterNode.description || "(No summary)"}
          </div>
        )}
      </div>


      {/* Scenes */}
      {chapter.scenes.map((scene, sceneIndex) => (
        <SceneBlock
          key={scene.id}
          scene={scene}
          sceneIndex={sceneIndex}
          chapterId={chapter.id}
          chapterColor={chapterColor}
          onFocusNode={onFocusNode}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          hoveredSceneId={hoveredSceneId}
          setHoveredSceneId={setHoveredSceneId}
          hoveredChapterId={hoveredChapterId}
          setHoveredChapterId={setHoveredChapterId}
          setHoveredDetails={setHoveredDetails}
          nodeRefs={nodeRefs}
          focusedNodeId={focusedNodeId}
          focusedSceneId={focusedSceneId}
          searchResults={searchResults}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}
