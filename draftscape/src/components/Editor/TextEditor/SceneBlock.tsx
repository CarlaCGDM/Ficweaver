// src/components/Editor/TextEditor/SceneBlock.tsx
import type { TextNode, NodeData } from "../../../context/storyStore/types";
import { sceneSeparatorStyle } from "./textEditorStyles";
import TextNodeBlock from "./TextNodeBlock";

type SceneLike = {
  id: string;
  title?: string;
  description?: string;
  nodes: NodeData[]; // mixed; we’ll filter text below
};

interface SceneBlockProps {
  scene: SceneLike;
  sceneIndex: number;

  // NEW: we don’t pass a full Chapter object anymore
  chapterId: string;
  chapterColor: string;

  onFocusNode: (nodeId: string) => void;

  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  hoveredSceneId: string | null;
  setHoveredSceneId: (id: string | null) => void;
  hoveredChapterId: string | null;
  setHoveredChapterId: (id: string | null) => void;
  setHoveredDetails: (details: any) => void;

  nodeRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  focusedNodeId: string | null;
  focusedSceneId: string | null;

  searchResults?: { chapters: string[]; textNodes: string[] };
  searchQuery?: string;
}

export default function SceneBlock({
  scene,
  sceneIndex,
  chapterId,
  chapterColor,
  onFocusNode,
  hoveredId,
  setHoveredId,
  hoveredSceneId,
  setHoveredSceneId,
  hoveredChapterId,
  setHoveredChapterId,
  setHoveredDetails,
  nodeRefs,
  focusedNodeId,
  focusedSceneId,
  searchResults,
  searchQuery = "",
}: SceneBlockProps) {
  // Filter visible text nodes only
  const visibleTextNodes: TextNode[] = scene.nodes.filter(
    (n): n is TextNode =>
      n.type === "text" &&
      (!searchResults?.textNodes?.length || searchResults.textNodes.includes(n.id))
  );

  if (visibleTextNodes.length === 0) return null;

  return (
    <div>
      {/* Scene separator (between scenes) */}
      {sceneIndex > 0 && <div style={sceneSeparatorStyle}>———</div>}

      {/* Render text nodes */}
      {visibleTextNodes.map((txt) => (
        <TextNodeBlock
          key={txt.id}
          textNode={txt}
          scene={{ id: scene.id, title: scene.title }}
          chapterId={chapterId}
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
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}
