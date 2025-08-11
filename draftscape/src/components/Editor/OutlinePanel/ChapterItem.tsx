import { buttonRowStyle, chapterHeaderStyle, pinButtonStyle } from "./outlinePanelStyles";
import SceneItem from "./SceneItem";
import type { NodeData, Chapter } from "../../../context/storyStore/types";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ChapterItemProps {
  chapter: Chapter;
  chapterIndex: number;
  focusedNodeId?: string;
  onFocusNode: (nodeId: string) => void;
  onEditNode: (node: NodeData) => void;
  showActionButtons: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  openScenes: Record<string, boolean>;
  nodeRefs: React.MutableRefObject<Record<string, HTMLLIElement | null>>;
}

// Normalize chapter color (handles legacy numeric color or new string)
function resolveChapterColor(chapter: Chapter): string {
  const anyCh = chapter as any;
  if (typeof anyCh.colorIndex === "number") {
    return `var(--chapter-color-${anyCh.colorIndex + 1})`;
  }
  if (typeof chapter.color === "number") {
    return `var(--chapter-color-${(chapter.color as number) + 1})`;
  }
  return (chapter.color as string) ?? `var(--chapter-color-1)`;
}

export default function ChapterItem({
  chapter,
  focusedNodeId,
  onFocusNode,
  onEditNode,
  showActionButtons,
  isOpen,
  onToggleOpen,
  openScenes,
  nodeRefs,
}: ChapterItemProps) {
  const addScene = useStoryStore((state) => state.addScene);
  const addChapter = useStoryStore((state) => state.addChapter);
  const deleteNode = useStoryStore((state) => state.deleteNode);

  const isFocused = focusedNodeId === chapter.chapterNode.id;
  const chapterColor = resolveChapterColor(chapter);

  // Precompute header base style
  const headerBase = chapterHeaderStyle(chapterColor);

  return (
    <li
      ref={(el) => {
        nodeRefs.current[chapter.chapterNode.id] = el;
      }}
      style={{ marginBottom: "6px" }}
    >
      {/* Chapter Header */}
      <div
        style={{
          ...headerBase,
          background: isFocused ? "var(--color-warningBg)" : headerBase.background,
          // keep the text readable on warning background
          color: isFocused ? "var(--color-text)" : headerBase.color,
        }}
        onClick={() => onFocusNode(chapter.chapterNode.id)}
      >
        <button
          style={pinButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onToggleOpen();
          }}
        >
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span style={{ cursor: "pointer", flex: 1 }}>📘 {chapter.chapterNode.title}</span>
      </div>

      {showActionButtons && (
        <div style={buttonRowStyle}>
          <button onClick={() => onEditNode(chapter.chapterNode)}>✏️</button>
          <button style={{ color: "red" }} onClick={() => deleteNode(chapter.chapterNode.id)}>🗑️</button>
          <button onClick={() => addScene(chapter.id, chapter.chapterNode.id)}>+ Scene After</button>
          {!chapter.scenes.length && <button onClick={() => addChapter(chapter.chapterNode.id)}>+ Chapter After</button>}
        </div>
      )}

      {isOpen && (
        <ul style={{ listStyle: "none", margin: "4px 0 0 12px", padding: 0 }}>
          {chapter.scenes.map((sc) => (
            <SceneItem
              key={sc.id}
              scene={sc}
              chapterId={chapter.id}
              chapterColor={chapterColor}         
              focusedNodeId={focusedNodeId}
              onFocusNode={onFocusNode}
              onEditNode={onEditNode}
              showActionButtons={showActionButtons}
              isOpen={openScenes[sc.id] === true}
              nodeRefs={nodeRefs}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
