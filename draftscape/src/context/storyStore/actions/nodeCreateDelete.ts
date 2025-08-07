// src/context/storyStore/actions/nodeCrud.ts
import { nanoid } from "nanoid";
import { CHAPTER_COLORS } from "../colors";
import { getLastNodePosition, collectShiftGroup, shiftNodes } from "../helpers";
import type { ChapterNode, SceneNode, TextNode } from "../types";

export const nodeCrudActions = (set: any, get: any) => ({
  // ✅ Add Chapter (with undo/redo tracking)
  addChapter: (insertAfterNodeId?: string) => {
    get().pushHistory();
    const story = { ...get().story };
    const chapterCount = story.chapters.length + 1;
    const chapterColor =
      CHAPTER_COLORS[(chapterCount - 1) % CHAPTER_COLORS.length];
    const chapterTitle = `New Chapter ${chapterCount}`;

    // 1. Determine insertion position
    let refPos = getLastNodePosition(story);
    if (insertAfterNodeId) {
      let foundNode = null;
      outer: for (const ch of story.chapters) {
        if (ch.chapterNode.id === insertAfterNodeId) {
          foundNode = ch.chapterNode;
          break outer;
        }
        for (const sc of ch.scenes) {
          for (const n of sc.nodes) {
            if (n.id === insertAfterNodeId) {
              foundNode = n;
              break outer;
            }
          }
        }
      }
      if (foundNode) refPos = foundNode.position;
    }

    // 2. Create the new chapter node
    const chapterNode: ChapterNode = {
      id: nanoid(),
      type: "chapter",
      title: chapterTitle,
      position: { x: refPos.x + 0, y: refPos.y + 100 },
    };
    const newChapter = {
      id: nanoid(),
      title: chapterTitle,
      chapterNode,
      color: chapterColor,
      scenes: [],
    };

    // 3. Insert into story.chapters
    if (insertAfterNodeId) {
      const targetChapterIndex = story.chapters.findIndex(
        (ch: { chapterNode: { id: string; }; scenes: any[]; }) =>
          ch.chapterNode.id === insertAfterNodeId ||
          ch.scenes.some((sc: { nodes: any[]; }) =>
            sc.nodes.some((n: { id: string; }) => n.id === insertAfterNodeId)
          )
      );
      if (targetChapterIndex !== -1) {
        story.chapters.splice(targetChapterIndex + 1, 0, newChapter);

        // 4. Shift all *subsequent* chapters (top-level only)
        story.chapters.slice(targetChapterIndex + 2).forEach((subCh: { chapterNode: { type: string; id: string; }; }) => {
          // guard so we only ever shift actual chapters
          if (subCh.chapterNode.type !== "chapter") return;
          const group = collectShiftGroup(story, subCh.chapterNode.id);
          shiftNodes(story, group, { x: 0, y: 100 });
        });
      } else {
        story.chapters.push(newChapter);
      }
    } else {
      story.chapters.push(newChapter);
    }

    // 5. Commit
    set({ story });
  },

  // ✅ Add Scene
  addScene: (chapterId: string, insertAfterNodeId?: string) => {
    get().pushHistory();
    const story = { ...get().story };
    const chapter = story.chapters.find((c: { id: string; }) => c.id === chapterId);
    if (!chapter) return;

    const sceneCount = chapter.scenes.length + 1;
    const sceneTitle = `New Scene ${sceneCount}`;
    const baseColor = chapter.color;

    // Reference position logic
    let refPos = chapter.chapterNode.position;
    if (insertAfterNodeId && insertAfterNodeId !== chapter.chapterNode.id) {
      const targetNode = chapter.scenes.flatMap((sc: { nodes: any; }) => sc.nodes).find((n: { id: string; }) => n.id === insertAfterNodeId);
      if (targetNode) refPos = targetNode.position;
    } else if (insertAfterNodeId === chapter.chapterNode.id && chapter.scenes.length > 0) {
      const firstScene = chapter.scenes[0];
      refPos = { x: firstScene.nodes[0].position.x - 0, y: firstScene.nodes[0].position.y - 100 };
    } else if (chapter.scenes.length > 0) {
      const lastScene = chapter.scenes[chapter.scenes.length - 1];
      const texts = lastScene.nodes.filter((n: { type: string; }) => n.type === "text");
      refPos = texts.length > 0
        ? texts[texts.length - 1].position
        : (lastScene.nodes.find((n: { type: string; }) => n.type === "scene")?.position || refPos);
    }

    const sceneNode: SceneNode = {
      id: nanoid(),
      type: "scene",
      title: sceneTitle,
      position: { x: refPos.x + 0, y: refPos.y + 100 },
    };

    const newScene = {
      id: nanoid(),
      title: sceneTitle,
      color: baseColor,
      nodes: [sceneNode],
    };

    if (insertAfterNodeId) {
      if (insertAfterNodeId === chapter.chapterNode.id) {
        chapter.scenes.unshift(newScene);
        chapter.scenes.slice(1).forEach((sc: { nodes: { id: string; }[]; }) => {
          const group = collectShiftGroup(story, sc.nodes[0].id);
          shiftNodes(story, group, { x: 0, y: 100 });
        });
      } else {
        const index = chapter.scenes.findIndex((sc: { nodes: any[]; }) => sc.nodes.some((n: { id: string; }) => n.id === insertAfterNodeId));
        if (index !== -1) {
          chapter.scenes.splice(index + 1, 0, newScene);
          chapter.scenes.slice(index + 2).forEach((sc: { nodes: { id: string; }[]; }) => {
            const group = collectShiftGroup(story, sc.nodes[0].id);
            shiftNodes(story, group, { x: 0, y: 100 });
          });
        } else {
          chapter.scenes.push(newScene);
        }
      }
    } else {
      chapter.scenes.push(newScene);
    }

    // Shift later chapters
    const chapterIndex = story.chapters.findIndex((c: { id: string; }) => c.id === chapterId);
    story.chapters.slice(chapterIndex + 1).forEach((subCh: { chapterNode: { id: string; }; }) => {
      const group = collectShiftGroup(story, subCh.chapterNode.id);
      shiftNodes(story, group, { x: 0, y: 100 });
    });

    set({ story });
  },

  // ✅ Add Text Node
  // ✅ Add Text Node
addTextNode: (sceneId: string, insertAfterNodeId?: string) => {
  // Save current state for undo
  get().pushHistory();

  // Clone story
  const story = { ...get().story };

  // Find the target scene
  const scene = story.chapters
    .flatMap((ch: { scenes: any; }) => ch.scenes)
    .find((sc: { id: string; }) => sc.id === sceneId);
  if (!scene) return;

  // Compute new node’s default text & position
  const textCount = scene.nodes.filter((n: { type: string; }) => n.type === "text").length + 1;
  const refNode = insertAfterNodeId
    ? scene.nodes.find((n: { id: string; }) => n.id === insertAfterNodeId)!
    : scene.nodes.length > 1
      ? scene.nodes[scene.nodes.length - 1]
      : scene.nodes[0];

  // ── NEW STICKER LOGIC ──
  const imageIndex = Math.floor(Math.random() * 7) + 1;
  const corners = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
  const corner = corners[Math.floor(Math.random() * corners.length)];
  // ──────────────────────

  // Build the new text node
  const textNode: TextNode = {
    id: nanoid(),
    type: "text",
    text: `<p>New node ${textCount}.</p>`,
    position: { x: refNode.position.x, y: refNode.position.y + 100 },
    images: [],
    // Persist sticker choice
    sticker: {
      imageIndex,
      corner,
    },
  };

  // Insert the new node
  if (insertAfterNodeId) {
    const index = scene.nodes.findIndex((n: { id: string; }) => n.id === insertAfterNodeId);
    if (index !== -1) {
      scene.nodes.splice(index + 1, 0, textNode);

      // Shift subsequent text/scene nodes in this scene
      const nodesToShift = scene.nodes.slice(index + 2);
      nodesToShift.forEach((n: { type: string; id: string; }) => {
        if (n.type === "picture" || n.type === "annotation") return;
        const group = collectShiftGroup(story, n.id);
        shiftNodes(story, group, { x: 0, y: 100 });
      });
    } else {
      scene.nodes.push(textNode);
    }
  } else {
    scene.nodes.push(textNode);
  }

  // Shift later scenes in the same chapter
  const chapter = story.chapters.find((ch: { scenes: any[]; }) =>
    ch.scenes.some((sc: { id: string; }) => sc.id === sceneId)
  );
  if (chapter) {
    const sceneIndex = chapter.scenes.findIndex((sc: { id: string; }) => sc.id === sceneId);
    chapter.scenes.slice(sceneIndex + 1).forEach((sc: { nodes: { id: string; }[]; }) => {
      const group = collectShiftGroup(story, sc.nodes[0].id);
      shiftNodes(story, group, { x: 0, y: 100 });
    });

    // Shift later chapters
    const chapterIndex = story.chapters.findIndex((c: { id: any; }) => c.id === chapter.id);
    story.chapters.slice(chapterIndex + 1).forEach((subCh: { chapterNode: { id: string; }; }) => {
      const group = collectShiftGroup(story, subCh.chapterNode.id);
      shiftNodes(story, group, { x: 0, y: 100 });
    });
  }

  // Commit update
  set({ story });
},


  // ✅ Delete Node
  deleteNode: (nodeId: string) => {
    get().pushHistory();
    const story = { ...get().story };

    const chapterIndex = story.chapters.findIndex((ch: { chapterNode: { id: string; }; }) => ch.chapterNode.id === nodeId);
    if (chapterIndex !== -1) {
      story.chapters.splice(chapterIndex, 1);
      set({ story });
      return;
    }

    for (const ch of story.chapters) {
      const sceneIndex = ch.scenes.findIndex((sc: { nodes: any[]; }) => sc.nodes.some((n: { id: string; type: string; }) => n.id === nodeId && n.type === "scene"));
      if (sceneIndex !== -1) {
        ch.scenes.splice(sceneIndex, 1);
        set({ story });
        return;
      }
    }

    story.chapters.forEach((ch: { scenes: any[]; }) => {
      ch.scenes.forEach((sc: { nodes: any[]; }) => {
        sc.nodes = sc.nodes.filter((n: { id: string; }) => n.id !== nodeId);
      });
    });

    set({ story });
  },
});
