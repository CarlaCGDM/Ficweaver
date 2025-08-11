// src/components/Canvas/NodeConnections.tsx
import type { Story, NodeData } from "../../context/storyStore/types";

interface NodeConnectionsProps {
  story: Story;
}

export default function NodeConnections({ story }: NodeConnectionsProps) {
  // resolve chapter color to a CSS var (or legacy hex if present)
  const resolveChapterColor = (chapter: any) => {
    if (typeof chapter.color === "string") return chapter.color; // legacy save fallback
    const idx = (chapter.colorIndex ?? 0) + 1; // 1-based
    return `var(--chapter-color-${idx})`;
  };

  const resolveSceneColor = (chapter: any, scene: any) => {
    const idx = (scene?.colorIndex ?? chapter?.colorIndex ?? 0) + 1;
    return `var(--chapter-color-${idx})`;
  };

  const orderedNodes: { node: NodeData; chapterColor: string }[] = [];

  // Flatten outline order: Chapters → Scenes → Texts (carry chapter color var)
  story.chapters.forEach((chapter) => {
    const chColor = resolveChapterColor(chapter);
    orderedNodes.push({ node: chapter.chapterNode, chapterColor: chColor });

    chapter.scenes.forEach((scene) => {
      const sceneNode = scene.nodes.find((n) => n.type === "scene");
      const sceneColor = resolveSceneColor(chapter, scene);
      if (sceneNode) orderedNodes.push({ node: sceneNode, chapterColor: sceneColor });

      scene.nodes
        .filter((n) => n.type === "text")
        .forEach((textNode) =>
          orderedNodes.push({ node: textNode, chapterColor: sceneColor })
        );
    });
  });

  // Build a map of all nodes by ID
  const allNodes: Record<string, NodeData> = {};
  story.chapters.forEach((chapter) => {
    allNodes[chapter.chapterNode.id] = chapter.chapterNode;
    chapter.scenes.forEach((scene) => {
      scene.nodes.forEach((node) => {
        allNodes[node.id] = node;
      });
    });
  });

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
        {/* Outline-order connections */}
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
              stroke={chapterColor}     // CSS var or legacy hex
              strokeOpacity={0.6}       // replaces shadeColor()
              strokeWidth="2"
              fill="none"
            />
          );
        })}

        {/* Picture/Annotation/Event connections */}
        {story.chapters.flatMap((chapter) =>
          chapter.scenes.flatMap((scene) =>
            scene.nodes
              .filter(
                (n) =>
                  n.type === "picture" || n.type === "annotation" || n.type === "event"
              )
              .map((node) => {
                if (!node.connectedTo) return null;
                const target = allNodes[node.connectedTo];
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
              })
          )
        )}
      </g>
    </svg>
  );
}
