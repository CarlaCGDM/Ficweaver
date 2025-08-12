// useCanvasFocus.ts
import type { Story, NodeData } from "../../../context/storyStore/types";

export function useCanvasFocus(transformRef: any, story: Story) {
  const resetView = () => transformRef.current?.resetTransform();

  const NODE_WIDTHS: Record<NodeData["type"], number> = {
    chapter: 600,
    scene: 600,
    text: 600,
    event: 560,
    picture: 200,
    annotation: 300,
  };

  const getViewportSize = () => {
    const el = document.querySelector(".canvas-container") as HTMLElement | null;
    return {
      width: el?.clientWidth ?? window.innerWidth,
      height: el?.clientHeight ?? window.innerHeight,
    };
  };

  const getNodeHeight = (nodeId: string) => {
    const el = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
    return el?.offsetHeight ?? 80; // fallback if not found
  };

  const centerOnPosition = (pos: { x: number; y: number }, type: NodeData["type"], nodeId: string) => {
    if (!transformRef.current) return;

    const state = transformRef.current.state || {};
    const scale = state.scale ?? 1;

    const { width: vw, height: vh } = getViewportSize();

    const nodeWidth = NODE_WIDTHS[type] ?? 600;
    const nodeHeight = getNodeHeight(nodeId);

    const nodeCenterX = (pos.x + nodeWidth / 2) * scale;
    const nodeCenterY = (pos.y + nodeHeight / 2) * scale;

    const targetX = vw / 2 - nodeCenterX;
    const targetY = vh / 2 - nodeCenterY;

    // keep your easing/duration contract
    transformRef.current.setTransform(targetX, targetY, scale, 200, "easeOut");
  };

  const focusNode = (nodeId?: string) => {
    if (!nodeId) return resetView();
    const node = story.nodeMap[nodeId];
    if (!node) return;

    // try now
    centerOnPosition(node.position, node.type, node.id);
    // try once after paint to catch freshly-mounted DOM
    requestAnimationFrame(() => centerOnPosition(node.position, node.type, node.id));
  };

  return { focusNode, resetView };
}
