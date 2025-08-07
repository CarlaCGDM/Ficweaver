import type { Story, NodeData } from "../../context/storyStore/types";
import { shadeColor } from "../../context/storyStore/colors"; // reuse our color utility

interface NodeConnectionsProps {
  story: Story;
}

export default function NodeConnections({ story }: NodeConnectionsProps) {
  const orderedNodes: { node: NodeData; chapterColor: string }[] = [];

  // Flatten outline order: Chapters → Scenes → Texts (with chapter color included)
  story.chapters.forEach((chapter) => {
    orderedNodes.push({ node: chapter.chapterNode, chapterColor: chapter.color });
    chapter.scenes.forEach((scene) => {
      const sceneNode = scene.nodes.find((n) => n.type === "scene");
      if (sceneNode) orderedNodes.push({ node: sceneNode, chapterColor: chapter.color });
      scene.nodes
        .filter((n) => n.type === "text")
        .forEach((textNode) => orderedNodes.push({ node: textNode, chapterColor: chapter.color }));
    });
  });

  // Build a map of all nodes by ID (for quick lookup when connecting pictures/annotations)
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
    <g transform="translate(1000, 1000)"> {/* ✅ Apply offset here */}
      {/* Original ordered node connections */}
      {orderedNodes.map((entry, idx) => {
        if (idx === orderedNodes.length - 1) return null;

        const { node, chapterColor } = entry;
        const nextEntry = orderedNodes[idx + 1];
        const nextNode = nextEntry.node;

        const x1 = node.position.x + 300;
        const y1 = node.position.y + 30;
        const x2 = nextNode.position.x + 300;
        const y2 = nextNode.position.y + 30;

        const midX = (x1 + x2) / 2;
        const path = `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
        const fadedColor = shadeColor(chapterColor, 10);

        return (
          <path
            key={`${node.id}-${nextNode.id}`}
            d={path}
            stroke={fadedColor}
            strokeWidth="2"
            fill="none"
          />
        );
      })}

      {/* Picture/Annotation connections */}
      {story.chapters.flatMap((chapter) =>
        chapter.scenes.flatMap((scene) =>
          scene.nodes
            .filter((n) => n.type === "picture" || n.type === "annotation" || n.type === "event")
            .map((node) => {
              if (!node.connectedTo) return null;
              const target = allNodes[node.connectedTo];
              if (!target) return null;

              const x1 = node.type === "picture" ? node.position.x + 100 : node.type === "event"? node.position.x + 260 : node.position.x + 125;
              const y1 = node.position.y + 40;
              const x2 = target.position.x + 300;
              const y2 = target.position.y + 30;
              const midX = (x1 + x2) / 2;

              const path = `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;

              return (
                <path
                  key={`${node.id}-connect-${target.id}`}
                  d={path}
                  stroke="#999"
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
