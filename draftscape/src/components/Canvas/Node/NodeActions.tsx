// NodeActions.tsx
import { useState, useMemo } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import type { NodeData } from "../../../context/storyStore/types";
import { Edit3, Trash2, Plus } from "lucide-react";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";

interface NodeActionsProps {
  nodeId: string;
  onEditNode: (node: NodeData) => void;
}

export default function NodeActions({ nodeId, onEditNode }: NodeActionsProps) {
  const story = useStoryStore((state) => state.story);
  const deleteNode = useStoryStore((state) => state.deleteNode);
  const addTextNode = useStoryStore((state) => state.addTextNode);
  const addScene = useStoryStore((state) => state.addScene);
  const addChapter = useStoryStore((state) => state.addChapter);
  const addPictureNode = useStoryStore((state) => state.addPictureNode);
  const addAnnotationNode = useStoryStore((state) => state.addAnnotationNode);
  const addEventNode = useStoryStore((state) => state.addEventNode);

  // ✅ Theme colors (including chapter palette)
  const { theme, mode } = useTheme();
  const chapterColors = theme.chapterColors?.[mode] ?? [];

  // Helper: prefer theme array, fall back to CSS var set by ThemeProvider
  const getChapterColor = (i: number) =>
    chapterColors[i] ?? `var(--chapter-color-${i + 1})`;

  // Palette mapping for buttons
  const buttonPalette = {
    chapter: getChapterColor(0),
    picture: getChapterColor(1),
    text: getChapterColor(2),
    scene: getChapterColor(3),
    annotation: getChapterColor(4),
    // If a 6th color exists, use it for event; otherwise fall back to accent
    event: chapterColors[5] ?? "var(--color-accent)",
  };

  const [hovered, setHovered] = useState(false);

  const hierarchy = useMemo(() => {
    for (const ch of story.chapters) {
      if (ch.chapterNode.id === nodeId) {
        return { nodeType: "chapter", node: ch.chapterNode, chapter: ch };
      }
      for (const sc of ch.scenes) {
        const node = sc.nodes.find((n) => n.id === nodeId);
        if (node) return { nodeType: node.type, node, chapter: ch, scene: sc };
      }
    }
    return null;
  }, [story, nodeId]);

  if (!hierarchy) return null;
  const { nodeType, chapter, scene, node } = hierarchy;

  const isMediaNode =
    nodeType === "picture" || nodeType === "annotation" || nodeType === "event";

  const showNewText = !isMediaNode && (nodeType === "scene" || nodeType === "text");
  const showNewScene =
    !isMediaNode &&
    (nodeType === "chapter" ||
      (scene &&
        (() => {
          const lastNonMediaNode = [...scene.nodes]
            .reverse()
            .find((n) => n.type === "text" || n.type === "scene");
          return lastNonMediaNode?.id === nodeId;
        })()));
  const showNewChapter =
    !isMediaNode &&
    (() => {
      const lastScene = chapter.scenes[chapter.scenes.length - 1];
      if (!lastScene) return nodeType === "chapter";
      const lastNonMediaNode = [...lastScene.nodes]
        .reverse()
        .find((n) => n.type === "text" || n.type === "scene");
      return lastNonMediaNode?.id === nodeId;
    })();

  const handleAddText = () => scene && addTextNode(scene.id, nodeId);
  const handleAddScene = () => addScene(chapter.id, nodeId);
  const handleAddChapter = () => addChapter(nodeId);
  const handleAddPicture = () => addPictureNode(nodeId);
  const handleAddAnnotation = () => addAnnotationNode(nodeId);
  const handleAddEvent = () => addEventNode(nodeId);

  const handleEditNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditNode(node);
  };
  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this node?")) deleteNode(nodeId);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "-40px",
        right: "-40px",
        width: "calc(100% + 50px)",
        height: "calc(100% + 90px)",
        zIndex: 300,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <>
          {/* ✅ Vertical Edit/Delete Stack (theme-aware) */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              right: "-5px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <button onClick={handleEditNode} style={editDeleteBtnStyle}>
              <Edit3 size={18} />
            </button>
            <button onClick={handleDeleteNode} style={editDeleteBtnStyle}>
              <Trash2 size={18} />
            </button>
          </div>

          {/* ✅ Horizontal Add Buttons Row (chapter palette) */}
          {!isMediaNode && (
            <div
              style={{
                position: "absolute",
                top: "-2px",
                right: "40px",
                display: "flex",
                flexDirection: "row",
                gap: "6px",
              }}
            >
              {showNewChapter && (
                <button onClick={handleAddChapter} style={addBtnStyle(buttonPalette.chapter)}>
                  <Plus size={16} /> 📘
                </button>
              )}
              {showNewScene && (
                <button onClick={handleAddScene} style={addBtnStyle(buttonPalette.scene)}>
                  <Plus size={16} /> 🎬
                </button>
              )}
              {showNewText && (
                <button onClick={handleAddText} style={addBtnStyle(buttonPalette.text)}>
                  <Plus size={16} /> 📝
                </button>
              )}
              <button onClick={handleAddPicture} style={addBtnStyle(buttonPalette.picture)}>
                <Plus size={16} /> 🖼️
              </button>
              <button onClick={handleAddAnnotation} style={addBtnStyle(buttonPalette.annotation)}>
                <Plus size={16} /> 💬
              </button>
              <button
                disabled
                style={{ ...addBtnStyle(buttonPalette.chapter), opacity: 0.5 }}
                title="Audio coming soon"
              >
                <Plus size={16} /> 🎵
              </button>
              <button onClick={handleAddEvent} style={addBtnStyle(buttonPalette.event)}>
                <Plus size={16} /> ⏱️
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Theme-aware base styles */
const editDeleteBtnStyle: React.CSSProperties = {
  background: "var(--color-panelAlt)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  borderRadius: "4px",
  width: "35px",
  height: "35px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const addBtnStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  color: "var(--color-accentText)",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  padding: "6px 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: "14px",
});
