// src/context/storyStore/actions/nodeCrud.ts
import { nanoid } from "nanoid";
import { CHAPTER_COLORS } from "../colors";
import { getLastNodePosition, collectShiftGroup, shiftNodes } from "../helpers";
import type { ChapterNode, SceneNode, TextNode } from "../types";
import { getNodeHeightById } from "../../../components/Canvas/utils/nodeMetrics";

const DEFAULT_PALETTE_SIZE = 5; // matches how many chapter-color vars you expose

export const nodeCrudActions = (set: any, get: any) => ({
  // ✅ Add Chapter (with undo/redo tracking)
  addChapter: (insertAfterNodeId?: string) => {
    get().pushHistory();
    const story = { ...get().story };

    const chapterCount = story.chapters.length + 1;
    const chapterColorIndex = (chapterCount - 1) % DEFAULT_PALETTE_SIZE;
    const chapterTitle = `New Chapter`;

    // 1) Determine insertion position
    let refPos = getLastNodePosition(story);
    let verticalOffset = 100;
    if (insertAfterNodeId) {
      let foundNode: any = null;
      outer: for (const ch of story.chapters) {
        if (ch.chapterNode.id === insertAfterNodeId) { foundNode = ch.chapterNode; break outer; }
        for (const sc of ch.scenes) {
          for (const n of sc.nodes) {
            if (n.id === insertAfterNodeId) { foundNode = n; break outer; }
          }
        }
      }
      if (foundNode) {
        refPos = foundNode.position;
        verticalOffset = getNodeHeightById(foundNode.id) / 2 + 100;
      }
    }

    // 2) Create the new chapter node
    const chapterNode: ChapterNode = {
      id: nanoid(),
      type: "chapter",
      title: chapterTitle,
      position: { x: refPos.x, y: refPos.y + verticalOffset },
    };

    const newChapter = {
      id: nanoid(),
      title: chapterTitle,
      chapterNode,
      colorIndex: chapterColorIndex, // 👈 store index, not hex
      scenes: [],
    };

    // 3) Insert into story.chapters
    if (insertAfterNodeId) {
      const targetChapterIndex = story.chapters.findIndex(
        (ch: any) =>
          ch.chapterNode.id === insertAfterNodeId ||
          ch.scenes.some((sc: any) =>
            sc.nodes.some((n: any) => n.id === insertAfterNodeId)
          )
      );
      if (targetChapterIndex !== -1) {
        story.chapters.splice(targetChapterIndex + 1, 0, newChapter);
        // 4) Shift subsequent chapters
        story.chapters.slice(targetChapterIndex + 2).forEach((subCh: any) => {
          const group = collectShiftGroup(story, subCh.chapterNode.id);
          shiftNodes(story, group, { x: 0, y: verticalOffset });
        });
      } else {
        story.chapters.push(newChapter);
      }
    } else {
      story.chapters.push(newChapter);
    }

    set({ story });
  },

  // ✅ Add Scene
 addScene: (chapterId: string, insertAfterNodeId?: string) => {
    get().pushHistory();
    const story = { ...get().story };
    const chapter = story.chapters.find((c: any) => c.id === chapterId);
    if (!chapter) return;

    const sceneCount = chapter.scenes.length + 1;
    const sceneTitle = `New Scene ${sceneCount}`;

    let refPos = chapter.chapterNode.position;
    let verticalOffset = getNodeHeightById(chapter.chapterNode.id) / 2 + 100;

    if (insertAfterNodeId && insertAfterNodeId !== chapter.chapterNode.id) {
      const targetNode = chapter.scenes
        .flatMap((sc: any) => sc.nodes)
        .find((n: any) => n.id === insertAfterNodeId);
      if (targetNode) {
        refPos = targetNode.position;
        verticalOffset = getNodeHeightById(targetNode.id) / 2 + 100;
      }
    } else if (insertAfterNodeId === chapter.chapterNode.id && chapter.scenes.length > 0) {
      const firstScene = chapter.scenes[0];
      refPos = firstScene.nodes[0].position;
      verticalOffset = getNodeHeightById(chapter.chapterNode.id) / 2 + 100;
    } else if (chapter.scenes.length > 0) {
      const lastScene = chapter.scenes[chapter.scenes.length - 1];
      const lastNode =
        lastScene.nodes.find((n: any) => n.type === "text") ||
        lastScene.nodes.find((n: any) => n.type === "scene");
      if (lastNode) {
        refPos = lastNode.position;
        verticalOffset = getNodeHeightById(lastNode.id) / 2 + 100;
      }
    }

    const sceneNode: SceneNode = {
      id: nanoid(),
      type: "scene",
      title: sceneTitle,
      position: { x: refPos.x, y: refPos.y + verticalOffset },
    };

    const newScene = {
      id: nanoid(),
      title: sceneTitle,
      colorIndex: chapter.colorIndex ?? 0, // 👈 mirror the chapter index (optional)
      nodes: [sceneNode],
    };

    if (insertAfterNodeId) {
      if (insertAfterNodeId === chapter.chapterNode.id) {
        chapter.scenes.unshift(newScene);
        chapter.scenes.slice(1).forEach((sc: any) => {
          const group = collectShiftGroup(story, sc.nodes[0].id);
          shiftNodes(story, group, { x: 0, y: verticalOffset });
        });
      } else {
        const index = chapter.scenes.findIndex((sc: any) =>
          sc.nodes.some((n: any) => n.id === insertAfterNodeId)
        );
        if (index !== -1) {
          chapter.scenes.splice(index + 1, 0, newScene);
          chapter.scenes.slice(index + 2).forEach((sc: any) => {
            const group = collectShiftGroup(story, sc.nodes[0].id);
            shiftNodes(story, group, { x: 0, y: verticalOffset });
          });
        } else {
          chapter.scenes.push(newScene);
        }
      }
    } else {
      chapter.scenes.push(newScene);
    }

    const chapterIndex = story.chapters.findIndex((c: any) => c.id === chapterId);
    story.chapters.slice(chapterIndex + 1).forEach((subCh: any) => {
      const group = collectShiftGroup(story, subCh.chapterNode.id);
      shiftNodes(story, group, { x: 0, y: verticalOffset });
    });

    set({ story });
  },
  // ✅ Add Text Node
  addTextNode: (sceneId: string, insertAfterNodeId?: string) => {
    get().pushHistory();

    const story = { ...get().story };

    const scene = story.chapters
      .flatMap((ch: any) => ch.scenes)
      .find((sc: any) => sc.id === sceneId);
    if (!scene) return;

    const textCount =
      scene.nodes.filter((n: any) => n.type === "text").length + 1;

    const refNode = insertAfterNodeId
      ? scene.nodes.find((n: any) => n.id === insertAfterNodeId)!
      : scene.nodes.length > 1
      ? scene.nodes[scene.nodes.length - 1]
      : scene.nodes[0];

    const baseHeight = getNodeHeightById(refNode.id);
    const verticalOffset = baseHeight / 2 + 100;

    const imageIndex = Math.floor(Math.random() * 7) + 1;
    const corners = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
    const corner = corners[Math.floor(Math.random() * corners.length)];

    const textNode: TextNode = {
      id: nanoid(),
      type: "text",
      text: `<p>New node ${textCount}.</p>`,
      position: { x: refNode.position.x, y: refNode.position.y + verticalOffset },
      images: [],
      sticker: {
        imageIndex,
        corner,
      },
    };

    if (insertAfterNodeId) {
      const index = scene.nodes.findIndex((n: any) => n.id === insertAfterNodeId);
      if (index !== -1) {
        scene.nodes.splice(index + 1, 0, textNode);
        const nodesToShift = scene.nodes.slice(index + 2);
        nodesToShift.forEach((n: any) => {
          if (n.type === "picture" || n.type === "annotation" || n.type === "event") return;
          const group = collectShiftGroup(story, n.id);
          shiftNodes(story, group, { x: 0, y: verticalOffset });
        });
      } else {
        scene.nodes.push(textNode);
      }
    } else {
      scene.nodes.push(textNode);
    }

    const chapter = story.chapters.find((ch: any) =>
      ch.scenes.some((sc: any) => sc.id === sceneId)
    );
    if (chapter) {
      const sceneIndex = chapter.scenes.findIndex((sc: any) => sc.id === sceneId);
      chapter.scenes.slice(sceneIndex + 1).forEach((sc: any) => {
        const group = collectShiftGroup(story, sc.nodes[0].id);
        shiftNodes(story, group, { x: 0, y: verticalOffset });
      });

      const chapterIndex = story.chapters.findIndex((c: any) => c.id === chapter.id);
      story.chapters.slice(chapterIndex + 1).forEach((subCh: any) => {
        const group = collectShiftGroup(story, subCh.chapterNode.id);
        shiftNodes(story, group, { x: 0, y: verticalOffset });
      });
    }

    set({ story });
  },

  // ✅ Delete Node
  deleteNode: (nodeId: string) => {
    get().pushHistory();
    const story = { ...get().story };

    const chapterIndex = story.chapters.findIndex((ch: any) => ch.chapterNode.id === nodeId);
    if (chapterIndex !== -1) {
      story.chapters.splice(chapterIndex, 1);
      set({ story });
      return;
    }

    for (const ch of story.chapters) {
      const sceneIndex = ch.scenes.findIndex((sc: any) =>
        sc.nodes.some((n: any) => n.id === nodeId && n.type === "scene")
      );
      if (sceneIndex !== -1) {
        ch.scenes.splice(sceneIndex, 1);
        set({ story });
        return;
      }
    }

    story.chapters.forEach((ch: any) => {
      ch.scenes.forEach((sc: any) => {
        sc.nodes = sc.nodes.filter((n: any) => n.id !== nodeId);
      });
    });

    set({ story });
  },
});
