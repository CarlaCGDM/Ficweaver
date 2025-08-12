import { buttonRowStyle, chapterHeaderStyle, pinButtonStyle } from "./outlinePanelStyles";
import SceneItem from "./SceneItem";
import type { NodeData, ChapterNode, SceneNode } from "../../../context/storyStore/types";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ChapterItemProps {
  chapter: ChapterNode;
  chapterIndex: number; // ✅ index from story.order
  focusedNodeId?: string;
  onFocusNode: (nodeId: string) => void;
  onEditNode: (node: NodeData) => void;
  showActionButtons: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  openScenes: Record<string, boolean>;
  nodeRefs: React.MutableRefObject<Record<string, HTMLLIElement | null>>;
}

export default function ChapterItem({
  chapter,
  chapterIndex,
  focusedNodeId,
  onFocusNode,
  onEditNode,
  showActionButtons,
  isOpen,
  onToggleOpen,
  openScenes,
  nodeRefs,
}: ChapterItemProps) {
  const createScene = useStoryStore((state) => state.createScene);
  const createChapter = useStoryStore((state) => state.createChapter);
  const deleteChapter = useStoryStore((state) => state.deleteChapter);
  const story = useStoryStore((state) => state.story);

  const { theme, mode } = useTheme(); // ✅ get theme + mode

  // Pick color from theme’s chapterColors by chapterIndex
  const chapterColor =
    theme.chapterColors[mode][chapterIndex % theme.chapterColors[mode].length];

  const isFocused = focusedNodeId === chapter.id;
  const headerBase = chapterHeaderStyle(chapterColor);

  // Get scene nodes for this chapter
  const sceneIds = story.childrenOrder[chapter.id] ?? [];
  const scenes = sceneIds
    .map((id) => story.nodeMap[id])
    .filter((n): n is SceneNode => !!n && n.type === "scene");

  return (
    <li
      ref={(el) => {
        nodeRefs.current[chapter.id] = el;
      }}
      style={{ marginBottom: "6px" }}
    >
      <div
        style={{
          ...headerBase,
          background: isFocused ? "var(--color-warningBg)" : headerBase.background,
          color: isFocused ? "var(--color-text)" : headerBase.color,
        }}
        onClick={() => onFocusNode(chapter.id)}
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
        <span style={{ cursor: "pointer", flex: 1 }}>📘 {chapter.title}</span>
      </div>

      {showActionButtons && (
        <div style={buttonRowStyle}>
          <button onClick={() => onEditNode(chapter)}>✏️</button>
          <button style={{ color: "red" }} onClick={() => deleteChapter(chapter.id)}>🗑️</button>
          <button onClick={() => createScene(chapter.id, "New Scene")}>+ Scene After</button>
          {!sceneIds.length && (
            <button onClick={() => createChapter("New Chapter", chapter.id)}>+ Chapter After</button>
          )}
        </div>
      )}

      {isOpen && (
        <ul style={{ listStyle: "none", margin: "4px 0 0 12px", padding: 0 }}>
          {scenes.map((scene) => (
            <SceneItem
              key={scene.id}
              scene={scene}
              chapterId={chapter.id}
              chapterColor={chapterColor}
              focusedNodeId={focusedNodeId}
              onFocusNode={onFocusNode}
              onEditNode={onEditNode}
              showActionButtons={showActionButtons}
              isOpen={openScenes[scene.id] === true}
              nodeRefs={nodeRefs}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
