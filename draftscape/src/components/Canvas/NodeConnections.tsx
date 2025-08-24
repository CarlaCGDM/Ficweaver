// src/components/Canvas/NodeConnections.tsx
import type {
  Story,
  NodeData,
  ChapterNode,
  SceneNode,
  TextNode,
  PictureNode,
  AnnotationNode,
  EventNode,
} from "../../context/storyStore/types";
import { useTheme } from "../../context/themeProvider/ThemeProvider";

interface NodeConnectionsProps {
  story: Story;
}

export default function NodeConnections({ story }: NodeConnectionsProps) {
  const { theme, mode } = useTheme();

  const getChapterColor = (chapterIndex: number) =>
    theme.chapterColors[mode][chapterIndex % theme.chapterColors[mode].length];

  // Build per-chapter chains: [chapter, scene..., text...]
  const chapterChains: Array<{
    color: string;
    chain: Array<ChapterNode | SceneNode | TextNode>;
  }> = [];

  story.order.forEach((chapterId, chapterIndex) => {
    const ch = story.nodeMap[chapterId];
    if (!ch || ch.type !== "chapter") return;

    const color = getChapterColor(chapterIndex);
    const chain: Array<ChapterNode | SceneNode | TextNode> = [ch];

    const sceneIds = (story.childrenOrder[ch.id] ?? []).filter(
      (id) => story.nodeMap[id]?.type === "scene"
    );

    sceneIds.forEach((sceneId) => {
      const sc = story.nodeMap[sceneId];
      if (!sc || sc.type !== "scene") return;

      chain.push(sc);

      const textIds = (story.childrenOrder[sc.id] ?? []).filter(
        (id) => story.nodeMap[id]?.type === "text"
      );
      textIds.forEach((tid) => {
        const tn = story.nodeMap[tid];
        if (tn && tn.type === "text") chain.push(tn);
      });
    });

    chapterChains.push({ color, chain });
  });

  const allNodes = story.nodeMap;

  // Small helper to draw a nice cubic curve
  const curvePath = (x1: number, y1: number, x2: number, y2: number) => {
    const midX = (x1 + x2) / 2;
    return `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
  };

  const centerX = (n: NodeData) => n.position.x + 300;
  const centerY = (n: NodeData) => n.position.y + 30;

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
      <g transform="translate(10000, 10000)">
        {/* Intra-chapter connections (no cross-chapter chaining) */}
        {chapterChains.map(({ chain, color }) =>
          chain.map((node, idx) => {
            const next = chain[idx + 1];
            if (!next) return null;

            const x1 = centerX(node);
            const y1 = centerY(node);
            const x2 = centerX(next);
            const y2 = centerY(next);

            return (
              <path
                key={`${node.id}-${next.id}`}
                d={curvePath(x1, y1, x2, y2)}
                stroke={color}
                strokeOpacity={0.6}
                strokeWidth="2"
                fill="none"
              />
            );
          })
        )}

        {/* Chapter-to-chapter connections (chapter i -> chapter i+1) */}
        {chapterChains.map((entry, idx) => {
          const next = chapterChains[idx + 1];
          if (!next) return null;

          const a = entry.chain[0]; // chapter node
          const b = next.chain[0];  // next chapter node
          if (!a || !b || a.type !== "chapter" || b.type !== "chapter") return null;

          const x1 = centerX(a);
          const y1 = centerY(a);
          const x2 = centerX(b);
          const y2 = centerY(b);

          return (
            <path
              key={`chapter-${a.id}-${b.id}`}
              d={curvePath(x1, y1, x2, y2)}
              stroke={entry.color}          
              strokeOpacity={0.8}
              strokeWidth="2.5"
              fill="none"
            />
          );
        })}

        {/* Picture/Annotation/Event dashed connections (unchanged) */}
        {Object.values(allNodes)
          .filter(
            (n): n is PictureNode | AnnotationNode | EventNode =>
              n.type === "picture" || n.type === "annotation" || n.type === "event"
          )
          .map((node) => {
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

            const x2 = centerX(target);
            const y2 = centerY(target);

            return (
              <path
                key={`${node.id}-connect-${target.id}`}
                d={curvePath(x1, y1, x2, y2)}
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
