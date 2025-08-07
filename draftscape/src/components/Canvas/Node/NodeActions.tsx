import { useState, useMemo } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import type { NodeData } from "../../../context/storyStore/types";
import { Edit3, Trash2, Plus } from "lucide-react";

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

  const isMediaNode = nodeType === "picture" || nodeType === "annotation" || nodeType === "event";;

  const showNewText = !isMediaNode && (nodeType === "scene" || nodeType === "text");
  const showNewScene = !isMediaNode && (
    nodeType === "chapter" ||
    (scene && (() => {
      const lastNonMediaNode = [...scene.nodes].reverse().find((n) => n.type === "text" || n.type === "scene");
      return lastNonMediaNode?.id === nodeId;
    })())
  );
  const showNewChapter = !isMediaNode && (() => {
    const lastScene = chapter.scenes[chapter.scenes.length - 1];
    if (!lastScene) return nodeType === "chapter";
    const lastNonMediaNode = [...lastScene.nodes].reverse().find((n) => n.type === "text" || n.type === "scene");
    return lastNonMediaNode?.id === nodeId;
  })();

  const handleAddText = () => scene && addTextNode(scene.id, nodeId);
  const handleAddScene = () => addScene(chapter.id, nodeId);
  const handleAddChapter = () => addChapter(nodeId);
  const handleAddPicture = () => addPictureNode(nodeId);
  const handleAddAnnotation = () => addAnnotationNode(nodeId);
  const handleAddEvent = () => addEventNode(nodeId);

  const handleEditNode = (e: React.MouseEvent) => { e.stopPropagation(); onEditNode(node); };
  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this node?")) deleteNode(nodeId);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "-40px",
        right: "-40px", // ✅ shift left to cover edit/delete
        width: "calc(100% + 50px)",
        height: "calc(100% + 90px)", // extra space for horizontal bar
        zIndex: 300,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <>
          {/* ✅ Vertical Edit/Delete Stack */}
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
            <button onClick={handleEditNode} style={editDeleteBtnStyle}><Edit3 size={18} /></button>
            <button onClick={handleDeleteNode} style={editDeleteBtnStyle}><Trash2 size={18} /></button>
          </div>

          {/* ✅ Horizontal Add Buttons Row */}
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
              {showNewChapter && <button onClick={handleAddChapter} style={addBtnStyle("#766DA7")}><Plus size={16} /> 📘</button>}
              {showNewScene && <button onClick={handleAddScene} style={addBtnStyle("#556842")}><Plus size={16} /> 🎬</button>}
              {showNewText && <button onClick={handleAddText} style={addBtnStyle("#7A9663")}><Plus size={16} /> 📝</button>}
              <button onClick={handleAddPicture} style={addBtnStyle("#15191E")}><Plus size={16} /> 🖼️</button>
              <button onClick={handleAddAnnotation} style={addBtnStyle("#A0AE91")}><Plus size={16} /> 💬</button>
              <button disabled style={{ ...addBtnStyle("#555"), opacity: 0.5 }}><Plus size={16} /> 🎵</button>
              <button onClick={handleAddEvent} style={addBtnStyle("#888888")}>
                <Plus size={16} /> ⏱️
              </button>

            </div>
          )}
        </>
      )}
    </div>
  );
}

const editDeleteBtnStyle: React.CSSProperties = {
  background: "#f8f8f8",
  border: "1px solid #ccc",
  color: "#333",
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
  color: "white",
  border: "none",
  borderRadius: "4px",
  padding: "6px 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: "14px",
});
