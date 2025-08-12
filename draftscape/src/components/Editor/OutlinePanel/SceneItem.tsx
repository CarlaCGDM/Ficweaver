import { useEffect, useState } from "react";
import { buttonRowStyle, sceneHeaderStyle, pinButtonStyle } from "./outlinePanelStyles";
import TextItem from "./TextItem";
import type { NodeData, SceneNode, TextNode } from "../../../context/storyStore/types";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SceneItemProps {
  scene: SceneNode; // now a SceneNode from nodeMap
  chapterId: string;
  chapterColor: string;
  focusedNodeId?: string;
  onFocusNode: (nodeId: string) => void;
  onEditNode: (node: NodeData) => void;
  showActionButtons: boolean;
  isOpen: boolean;
  nodeRefs: React.MutableRefObject<Record<string, HTMLLIElement | null>>;
}

// make a soft background from a color or CSS var (works w/ var(...) and hex)
function softBg(color: string, pct = 80): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

export default function SceneItem({
  scene,
  chapterId,
  chapterColor,
  focusedNodeId,
  onFocusNode,
  onEditNode,
  showActionButtons,
  isOpen,
  nodeRefs,
}: SceneItemProps) {
  const createScene = useStoryStore((state) => state.createScene);
  const createText = useStoryStore((state) => state.createText);
  const deleteScene = useStoryStore((state) => state.deleteScene);
  const story = useStoryStore((state) => state.story);

  const [collapsed, setCollapsed] = useState(!isOpen);

  useEffect(() => {
    setCollapsed(!isOpen);
  }, [isOpen]);

  const isFocused = focusedNodeId === scene.id;

  useEffect(() => {
    if (!focusedNodeId) return;
    const containsFocusedNode =
      scene.id === focusedNodeId ||
      (story.childrenOrder[scene.id] ?? []).some((childId) => childId === focusedNodeId);
    setCollapsed(!containsFocusedNode);
  }, [focusedNodeId, scene.id, story.childrenOrder]);

  const sceneColor = chapterColor;
  const headerBase = sceneHeaderStyle(sceneColor);

  // Get text nodes from childrenOrder
  const textIds = story.childrenOrder[scene.id] ?? [];
  const textNodes = textIds
    .map((id) => story.nodeMap[id])
    .filter((n): n is TextNode => !!n && n.type === "text");

  return (
    <li
      ref={(el) => {
        nodeRefs.current[scene.id] = el;
        textNodes.forEach((n) => {
          nodeRefs.current[n.id] = el;
        });
      }}
      style={{ marginBottom: "4px" }}
    >
      <div
        style={{
          ...headerBase,
          background: isFocused ? "var(--color-warningBg)" : softBg(sceneColor, 40),
          color: isFocused ? "var(--color-text)" : "#fff",
        }}
        onClick={() => onFocusNode(scene.id)}
      >
        <button
          style={pinButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((prev) => !prev);
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <span style={{ cursor: "pointer", flex: 1 }}>🎬 {scene.title}</span>
      </div>

      {showActionButtons && (
        <div style={buttonRowStyle}>
          <button onClick={() => onEditNode(scene)}>✏️</button>
          <button style={{ color: "red" }} onClick={() => deleteScene(scene.id)}>🗑️</button>
          <button onClick={() => createScene(chapterId, "New Scene")}>+ Scene After</button>
          <button onClick={() => createText(scene.id)}>+ Text After</button>
        </div>
      )}

      {!collapsed && (
        <ul style={{ listStyle: "none", margin: "4px 0 0 12px", padding: 0 }}>
          {textNodes.map((txt) => (
            <TextItem
              key={txt.id}
              textNode={txt}
              color={sceneColor}
              focusedNodeId={focusedNodeId}
              onFocusNode={onFocusNode}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
