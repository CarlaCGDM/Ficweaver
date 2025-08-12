// src/components/Canvas/NodeConnections.tsx
import type {
  Story,
  NodeData,
  ChapterNode,
  SceneNode,
  TextNode,
  PictureNode,
  AnnotationNode,
  EventNode
} from "../../context/storyStore/types";
import { useTheme } from "../../context/themeProvider/ThemeProvider";

interface NodeConnectionsProps {
  story: Story;
}

export default function NodeConnections({ story }: NodeConnectionsProps) {
  const { theme, mode } = useTheme();

  // For a given chapter index, get the CSS var color
  const getChapterColor = (chapterIndex: number) =>
    theme.chapterColors[mode][chapterIndex % theme.chapterColors[mode].length];

  /** 
 * Build ordered list of outline nodes:
 * Chapter -> Scene -> Text
 * (EXCLUDES media nodes)
 */
const orderedNodes: { node: ChapterNode | SceneNode | TextNode; chapterColor: string }[] = [];

story.order.forEach((chapterId, chapterIndex) => {
  const chapter = story.nodeMap[chapterId];
  if (!chapter || chapter.type !== "chapter") return;

  const chapterColor = getChapterColor(chapterIndex);
  orderedNodes.push({ node: chapter, chapterColor });

  // Only scenes under chapter
  const sceneIds = (story.childrenOrder[chapter.id] ?? []).filter(
    (id) => story.nodeMap[id]?.type === "scene"
  );

  sceneIds.forEach((sceneId) => {
    const scene = story.nodeMap[sceneId];
    if (!scene || scene.type !== "scene") return;

    orderedNodes.push({ node: scene, chapterColor });

    // Only texts under scene
    const textIds = (story.childrenOrder[scene.id] ?? []).filter(
      (id) => story.nodeMap[id]?.type === "text"
    );

    textIds.forEach((textId) => {
      const textNode = story.nodeMap[textId];
      if (!textNode || textNode.type !== "text") return;

      orderedNodes.push({ node: textNode, chapterColor });
    });
  });
});

  /**
   * Build a quick lookup map of all nodes for media linking
   */
  const allNodes = story.nodeMap;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <g transform="translate(1000, 1000)">
        {/* Outline sequential connections */}
        {orderedNodes.map((entry, idx) => {
          if (idx === orderedNodes.length - 1) return null;
          const { node, chapterColor } = entry;
          const nextNode = orderedNodes[idx + 1].node;

          const x1 = node.position.x + 300;
          const y1 = node.position.y + 30;
          const x2 = nextNode.position.x + 300;
          const y2 = nextNode.position.y + 30;

          const midX = (x1 + x2) / 2;
          const d = `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;

          return (
            <path
              key={`${node.id}-${nextNode.id}`}
              d={d}
              stroke={chapterColor}
              strokeOpacity={0.6}
              strokeWidth="2"
              fill="none"
            />
          );
        })}

        {/* Picture/Annotation/Event connections */}
        {Object.values(story.nodeMap)
          .filter(
            (n): n is PictureNode | AnnotationNode | EventNode =>
              n.type === "picture" || n.type === "annotation" || n.type === "event"
          )
          .map((node) => {
            // NEW: prefer explicit connectedTo, else use parentId
            const targetId = (node as any).connectedTo ?? (node as any).parentId;
            if (!targetId) return null;

            const target = allNodes[targetId];
            if (!target) return null;

            const x1 =
              node.type === "picture"
                ? node.position.x + 100
                : node.type === "event"
                  ? node.position.x + 260
                  : node.position.x + 125;
            const y1 = node.position.y + 40;
            const x2 = target.position.x + 300;
            const y2 = target.position.y + 30;
            const midX = (x1 + x2) / 2;

            const d = `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;

            return (
              <path
                key={`${node.id}-connect-${target.id}`}
                d={d}
                stroke="var(--color-nodeConnection)"
                strokeOpacity={0.8}
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="4,3"
              />
            );
          })}
      </g>
    </svg>
  );
}
