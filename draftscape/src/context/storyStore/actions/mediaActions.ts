import { nanoid } from "nanoid";
import type { PictureNode, AnnotationNode } from "../types";

export const mediaActions = (set: any, get: any) => ({

  // ✅ Add Picture Node (no ghost scene)
  addPictureNode: (connectToNodeId: any) => {
    console.log("🎨 [AddPictureNode] Starting. Connected to:", connectToNodeId);
    const { story } = get();
    get().pushHistory();

    const updatedStory = structuredClone(story);
    let spawnPos = { x: 100, y: 100 };

    // Position near parent
    if (connectToNodeId) {
      for (const ch of updatedStory.chapters) {
        if (ch.chapterNode.id === connectToNodeId) {
          spawnPos = { x: ch.chapterNode.position.x + 150, y: ch.chapterNode.position.y };
          console.log(`🎯 Parent is CHAPTER: ${ch.title}`);
          break;
        }
        for (const sc of ch.scenes) {
          const node = sc.nodes.find((n: { id: any }) => n.id === connectToNodeId);
          if (node) {
            spawnPos = { x: node.position.x + 150, y: node.position.y };
            console.log(`🎯 Parent is in SCENE: ${sc.title}, Node ID: ${node.id}`);
            break;
          }
        }
      }
    }

    const newNode: PictureNode = {
      id: nanoid(),
      type: "picture",
      description: "This is a picture description",
      position: spawnPos,
      connectedTo: connectToNodeId || undefined,
    };

    // Scene or chapter insertion
    let parentScene = null;
    if (connectToNodeId) {
      parentScene = updatedStory.chapters
        .flatMap((ch: { scenes: any }) => ch.scenes)
        .find((sc: { nodes: any[] }) => sc.nodes.some((n: { id: any }) => n.id === connectToNodeId));
    }

    if (parentScene) {
      console.log(`📌 Inserting picture into SCENE: ${parentScene.title}`);
      parentScene.nodes.push(newNode);
    } else {
      const targetChapter = updatedStory.chapters.find(
        (ch: { chapterNode: { id: any } }) => ch.chapterNode.id === connectToNodeId
      );

      if (targetChapter) {
        // 🚫 No ghost scene — keep as chapter-level loose media until scenes exist
        const chAny = targetChapter as any;
        if (!targetChapter.scenes.length) {
          if (!Array.isArray(chAny._looseMedia)) chAny._looseMedia = [];
          chAny._looseMedia.push(newNode);
          console.log(`📌 Picture node added to chapter "${targetChapter.title}" (loose, no scenes yet)`);
        } else {
          targetChapter.scenes[0].nodes.push(newNode);
          console.log(`📌 Picture node added to chapter "${targetChapter.title}" in first scene`);
        }
      } else {
        console.warn("⚠ No parent found. Adding to fallback chapter.");
        // Fallback: create or use first chapter, still avoid ghost scenes
        let chapter = updatedStory.chapters[0];
        if (!chapter) {
          chapter = {
            id: nanoid(),
            title: "Loose Elements",
            chapterNode: {
              id: nanoid(),
              type: "chapter",
              title: "Loose Elements",
              position: { x: 0, y: 0 },
            },
            scenes: [],
          } as any;
          updatedStory.chapters.push(chapter);
        }
        const chAny = chapter as any;
        if (!chapter.scenes.length) {
          if (!Array.isArray(chAny._looseMedia)) chAny._looseMedia = [];
          chAny._looseMedia.push(newNode);
          console.log(`📌 Picture node added to fallback chapter "${chapter.title}" (loose)`);
        } else {
          chapter.scenes[0].nodes.push(newNode);
          console.log(`📌 Picture node added to fallback chapter "${chapter.title}" in first scene`);
        }
      }
    }

    console.log("✅ [AddPictureNode] Done. Story snapshot:", updatedStory);
    set({ story: updatedStory });
  },

  // ✅ Add Annotation Node
  addAnnotationNode: (connectToNodeId: any) => {
    console.log("📝 [AddAnnotationNode] Starting. Connected to:", connectToNodeId);
    const { story } = get();
    get().pushHistory();

    const updatedStory = structuredClone(story);
    let spawnPos = { x: 100, y: 100 };

    // ✅ Position annotation near parent
    if (connectToNodeId) {
      for (const ch of updatedStory.chapters) {
        if (ch.chapterNode.id === connectToNodeId) {
          spawnPos = { x: ch.chapterNode.position.x + 150, y: ch.chapterNode.position.y + 50 };
          console.log(`🎯 Parent is CHAPTER: ${ch.title}`);
          break;
        }
        for (const sc of ch.scenes) {
          const node = sc.nodes.find((n: { id: any }) => n.id === connectToNodeId);
          if (node) {
            spawnPos = { x: node.position.x + 150, y: node.position.y + 50 };
            console.log(`🎯 Parent is in SCENE: ${sc.title}, Node ID: ${node.id}`);
            break;
          }
        }
      }
    }

    const newNode: AnnotationNode = {
      id: nanoid(),
      type: "annotation",
      text: "New annotation.",
      position: spawnPos,
      connectedTo: connectToNodeId || undefined,
    };

    // ✅ Scene or chapter insertion
    let parentScene = null;
    if (connectToNodeId) {
      parentScene = updatedStory.chapters
        .flatMap((ch: { scenes: any }) => ch.scenes)
        .find((sc: { nodes: any[] }) => sc.nodes.some((n: { id: any }) => n.id === connectToNodeId));
    }

    if (parentScene) {
      console.log(`📌 Inserting annotation into SCENE: ${parentScene.title}`);
      parentScene.nodes.push(newNode);
    } else {
      const targetChapter = updatedStory.chapters.find(
        (ch: { chapterNode: { id: any; }; }) => ch.chapterNode.id === connectToNodeId
      );
      if (targetChapter) {
        if (!targetChapter.scenes.length) {
          targetChapter.scenes.push({
            id: nanoid(),
            title: "Unlinked",
            color: targetChapter.color,
            nodes: [],
          });
        }
        targetChapter.scenes[0].nodes.push(newNode);
        console.log(`📌 Annotation node added to chapter "${targetChapter.title}"`);
      } else {
        console.warn("⚠ No parent found. Adding to fallback chapter/scene.");
        let chapter = updatedStory.chapters[0];
        if (!chapter) {
          chapter = {
            id: nanoid(),
            title: "Loose Elements",
            chapterNode: {
              id: nanoid(),
              type: "chapter",
              title: "Loose Elements",
              position: { x: 0, y: 0 },
            },
            scenes: [],
          };
          updatedStory.chapters.push(chapter);
        }
        if (!chapter.scenes.length) {
          chapter.scenes.push({
            id: nanoid(),
            title: "Unlinked",
            color: chapter.color,
            nodes: [],
          });
        }
        chapter.scenes[0].nodes.push(newNode);
      }
    }

    console.log("✅ [AddAnnotationNode] Done. Story snapshot:", updatedStory);
    set({ story: updatedStory });
  },
});
