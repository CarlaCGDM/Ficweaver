import type { NodeData, TextNode } from "../types";

export const nodeUpdateActions = (set: any, get: any) => ({
  updateNodeData: (nodeId: string, updates: Partial<NodeData>) => {
    const { story } = get();
    get().pushHistory();
    const updatedStory = structuredClone(story);

    for (const chapter of updatedStory.chapters) {
      if (chapter.chapterNode.id === nodeId && chapter.chapterNode.type === "chapter") {
        Object.assign(chapter.chapterNode, updates);
        if ("title" in updates && updates.title !== undefined) chapter.title = updates.title;
        if ("description" in updates && updates.description !== undefined) chapter.chapterNode.description = updates.description;
        if ("color" in updates && (updates as any).color !== undefined) chapter.color = (updates as any).color;
        break;
      }
      for (const scene of chapter.scenes) {
        const nodeIndex = scene.nodes.findIndex((n: { id: string; }) => n.id === nodeId);
        if (nodeIndex !== -1) {
          const targetNode = scene.nodes[nodeIndex];
          Object.assign(targetNode, updates);
          if (targetNode.type === "scene") {
            if ("title" in updates && updates.title !== undefined) scene.title = updates.title;
            if ("description" in updates && updates.description !== undefined) targetNode.description = updates.description;
            if ("color" in updates && (updates as any).color !== undefined) scene.color = (updates as any).color;
          }
          break;
        }
      }
    }
    set({ story: updatedStory });
  },

  updateNodeText: (nodeId: string, text: string) => {
    get().pushHistory();
    const story = { ...get().story };
    story.chapters.forEach((ch: { scenes: any[]; }) =>
      ch.scenes.forEach((sc: { nodes: any[]; }) =>
        sc.nodes.forEach((n: TextNode) => {
          if (n.id === nodeId && n.type === "text") (n as TextNode).text = text;
        })
      )
    );
    set({ story });
  },

  updateNodePosition: (nodeId: string, pos: { x: number; y: number }, isFromDrag = false) => {
    const story = { ...get().story };
    story.chapters.forEach((ch: { chapterNode: { id: string; position: { x: number; y: number; }; }; scenes: any[]; }) => {
      if (ch.chapterNode.id === nodeId) ch.chapterNode.position = pos;
      ch.scenes.forEach((sc: { nodes: any[]; }) => sc.nodes.forEach((n: { id: string; position: { x: number; y: number; }; }) => { if (n.id === nodeId) n.position = pos; }));
    });
    if (!isFromDrag) get().pushHistory();
    set({ story });
  },
});

