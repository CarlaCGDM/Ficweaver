import { nanoid } from "nanoid";
import { EARTH_TONES } from "../colors";
import type { PictureNode, AnnotationNode } from "../types";

export const mediaActions = (set: any, get: any) => ({

  // ✅ Add Picture Node
  addPictureNode: (connectToNodeId: any) => {
    console.log("🎨 [AddPictureNode] Starting. Connected to:", connectToNodeId);
    const { story } = get();
    get().pushHistory();

    const updatedStory = structuredClone(story);
    const color = EARTH_TONES[Math.floor(Math.random() * EARTH_TONES.length)];
    let spawnPos = { x: 100, y: 100 };

    // ✅ Position near parent
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
      color,
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
      console.log(`📌 Inserting picture into SCENE: ${parentScene.title}`);
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
        console.log(`📌 Picture node added to chapter "${targetChapter.title}"`);
      } else {
        console.warn("⚠ No parent found. Adding to fallback chapter/scene.");
        let chapter = updatedStory.chapters[0];
        if (!chapter) {
          chapter = {
            id: nanoid(),
            title: "Loose Elements",
            color: EARTH_TONES[0],
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
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio.",
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
            color: EARTH_TONES[0],
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
