import type { Scene, Chapter, TextNode } from "../../../context/storyStore/types";
import { sceneSeparatorStyle } from "./textEditorStyles";
import TextNodeBlock from "./TextNodeBlock";

interface SceneBlockProps {
  scene: Scene;
  sceneIndex: number;
  chapter: Chapter;
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
  focusedSceneId: string | null; // ✅ NEW
  searchResults?: { chapters: string[]; textNodes: string[] };
  searchQuery?: string;
}

export default function SceneBlock({
  scene,
  sceneIndex,
  chapter,
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
  focusedSceneId, // ✅ RECEIVED
  searchResults,
  searchQuery = "",
}: SceneBlockProps) {
  // ✅ Filter visible text nodes
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
          scene={scene}
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
          focusedSceneId={focusedSceneId} // ✅ Pass to text nodes
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}
