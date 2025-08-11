import type { Chapter } from "../../../context/storyStore/types";
import { hoverSummaryStyle, chapterTitleStyle } from "./textEditorStyles";
import SceneBlock from "./SceneBlock";
// Adjust the import path if your structure differs
import { useTheme } from "../../../context/themeProvider/ThemeProvider";

interface ChapterBlockProps {
  chapter: Chapter;
  index: number;
  onFocusNode: (nodeId: string) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  hoveredChapterId: string | null;
  setHoveredChapterId: (id: string | null) => void;
  hoveredSceneId: string | null;
  setHoveredSceneId: (id: string | null) => void;
  setHoveredDetails: (details: any) => void;
  getChapterWordCount: (ch: Chapter) => number;
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

  // ✅ Resolve chapter color from the active theme palette (same approach as ChapterNode)
  const { theme, mode } = useTheme();
  const palette: string[] = theme.chapterColors?.[mode] ?? [];

  const colorIndexFromModel = (() => {
    const anyCh = chapter as any;
    if (typeof anyCh.colorIndex === "number") return anyCh.colorIndex;
    if (typeof chapter.color === "number") return chapter.color as number;
    return 0; // default to first color when no index provided
  })();

  // Prefer theme palette; gracefully fall back to CSS vars if palette is shorter or missing
  const chapterColor: string =
    palette[colorIndexFromModel] ??
    `var(--chapter-color-${colorIndexFromModel + 1})`;

  const isChapterVisible =
    !searchResults?.chapters?.length || searchResults.chapters.includes(chapter.id);
  if (!isChapterVisible) return null;

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Chapter Title with ref and focus highlight */}
      <div
        ref={(el) => {
          nodeRefs.current[chapter.chapterNode.id] = el;
        }}
        className={focusedNodeId === chapter.chapterNode.id ? "focused-highlight" : ""}
        style={chapterTitleStyle(chapterColor, hoveredId === chapter.id)}
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
          chapter={chapter}
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
