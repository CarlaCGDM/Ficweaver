import type { Story } from "../../../context/storyStore/types";

export function useCanvasFocus(transformRef: any, story: Story) {
    const resetView = () => transformRef.current?.resetTransform();

    const focusNode = (nodeId?: string) => {
        if (!nodeId) {
            resetView();
            return;
        }

        for (const ch of story.chapters) {
            if (ch.chapterNode.id === nodeId) {
                centerOnPosition(ch.chapterNode.position);
                return;
            }
            for (const sc of ch.scenes) {
                for (const n of sc.nodes) {
                    if (n.id === nodeId) {
                        centerOnPosition(n.position);
                        return;
                    }
                }
            }
        }
    };

    const NODE_WIDTH = 600;
    const NODE_HEIGHT = 80; // approx.

    const centerOnPosition = (pos: { x: number; y: number }) => {
        if (!transformRef.current) return;

        const state = transformRef.current.state || { scale: 1 };
        const scale = state.scale ?? 1; // ✅ Default to 1 safely

        const offsetX = window.innerWidth / 4 - (pos.x + NODE_WIDTH / 2) * scale;
        const offsetY = window.innerHeight / 2 - (pos.y + NODE_HEIGHT / 2) * scale;

        // ✅ Smoothly animate to position
        transformRef.current.setTransform(offsetX, offsetY, scale, 200, "easeOut");
    };


    return { focusNode, resetView };
}
