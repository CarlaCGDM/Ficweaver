import { useEffect, useState } from "react";
import { buttonRowStyle, sceneHeaderStyle, pinButtonStyle } from "./outlinePanelStyles";
import TextItem from "./TextItem";
import type { NodeData, Scene } from "../../../context/storyStore/types";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SceneItemProps {
  scene: Scene;
  chapterId: string;
  chapterColor: string; // normalized string (e.g. "var(--chapter-color-1)")
  focusedNodeId?: string;
  onFocusNode: (nodeId: string) => void;
  onEditNode: (node: NodeData) => void;
  showActionButtons: boolean;
  isOpen: boolean;
  nodeRefs: React.MutableRefObject<Record<string, HTMLLIElement | null>>;
}

// normalize scene.color -> string (supports legacy numeric index)
function resolveSceneColor(scene: Scene, chapterColor: string): string {
  const anyScene = scene as any;
  if (typeof anyScene.color === "number") {
    return `var(--chapter-color-${anyScene.color + 1})`;
  }
  if (typeof anyScene.color === "string" && anyScene.color.length > 0) {
    return anyScene.color;
  }
  return chapterColor;
}

// make a soft background from a color or CSS var (works w/ var(...) and hex)
function softBg(color: string, pct = 80): string {
  // 80% of color mixed with 20% transparent ≈ 0.8 alpha look
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
  const addScene = useStoryStore((state) => state.addScene);
  const addTextNode = useStoryStore((state) => state.addTextNode);
  const deleteNode = useStoryStore((state) => state.deleteNode);

  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setCollapsed(!isOpen);
  }, [isOpen]);

  const sceneNode = scene.nodes.find((n) => n.type === "scene");
  const isFocused = !!sceneNode && focusedNodeId === sceneNode.id;

  useEffect(() => {
    if (!focusedNodeId) return;
    const containsFocusedNode =
      scene.id === focusedNodeId ||
      sceneNode?.id === focusedNodeId ||
      scene.nodes.some((n) => n.id === focusedNodeId);
    setCollapsed(!containsFocusedNode);
  }, [focusedNodeId, scene.id, sceneNode, scene.nodes]);

  const sceneColor = resolveSceneColor(scene, chapterColor);
  const headerBase = sceneHeaderStyle(sceneColor);

  return (
    <li
      ref={(el) => {
        if (sceneNode) nodeRefs.current[sceneNode.id] = el;
        scene.nodes.forEach((n) => {
          if (n.type === "text") nodeRefs.current[n.id] = el;
        });
      }}
      style={{ marginBottom: "4px" }}
    >
      <div
        style={{
          ...headerBase,
          // override background to be a diluted version of the scene color
          background: isFocused ? "var(--color-warningBg)" : softBg(sceneColor, 40),
          color: isFocused ? "var(--color-text)" : "#fff",
        }}
        onClick={() => sceneNode && onFocusNode(sceneNode.id)}
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

      {showActionButtons && sceneNode && (
        <div style={buttonRowStyle}>
          <button onClick={() => onEditNode(sceneNode)}>✏️</button>
          <button style={{ color: "red" }} onClick={() => deleteNode(sceneNode.id)}>🗑️</button>
          <button onClick={() => addScene(chapterId)}>+ Scene After</button>
          <button onClick={() => addTextNode(scene.id, sceneNode.id)}>+ Text After</button>
        </div>
      )}

      {!collapsed && (
        <ul style={{ listStyle: "none", margin: "4px 0 0 12px", padding: 0 }}>
          {scene.nodes
            .filter((n) => n.type === "text")
            .map((txt) => (
              <TextItem
                key={txt.id}
                textNode={txt}
                color={sceneColor} // pass the normalized string color
                focusedNodeId={focusedNodeId}
                onFocusNode={onFocusNode}
              />
            ))}
        </ul>
      )}
    </li>
  );
}
