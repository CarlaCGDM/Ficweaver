// src/components/Editor/ProjectIO/importProjectFromZip.ts
import JSZip from "jszip";
import type { Story, NodeData, ChapterNode, SceneNode, TextNode, PictureNode, AnnotationNode, EventNode } from "../../../../context/storyStore/types";
import { useStoryStore } from "../../../../context/storyStore/storyStore";
import { useImageStore } from "../../../../context/imageStore/imageStore";

/**
 * A very tolerant input shape for old (nested) projects.
 * We DON'T rely strictly on types here to be resilient to minor schema drift.
 */
type OldChapter = {
  id?: string;
  chapterNode: ChapterNode; // had position, title, etc.
  scenes: Array<{
    id: string;
    title: string;
    description?: string;
    // flat list of text + media nodes
    nodes: Array<NodeData & { connectedTo?: string }>;
  }>;
};

type OldNestedStory = {
  title: string;
  chapters: OldChapter[];
};

/**
 * Convert an old nested story to the new flat Story shape.
 * - Keeps IDs as-is.
 * - Preserves chapter order (story.order).
 * - childrenOrder:
 *    chapter -> [scenes in order]
 *    scene   -> [texts in order] (+ media appended if they were scene-level in old data)
 *    text    -> [media that had parentId === this text]
 * - Media parent strategy:
 *    - If media has an explicit parentId (text), keep it as the parent.
 *    - Otherwise, parent it to the scene.
 * - connectedTo is kept verbatim if present (used by visual dashed links).
 */
function nestedToFlatStory(old: OldNestedStory): Story {
  const nodeMap: Record<string, NodeData> = {};
  const order: string[] = [];
  const childrenOrder: Record<string, string[]> = {};

  // helper to ensure childrenOrder entry exists
  const ensure = (id: string) => {
    if (!childrenOrder[id]) childrenOrder[id] = [];
    return childrenOrder[id];
  };

  for (const ch of old.chapters) {
    const chapterId = ch.chapterNode?.id ?? ch.id!;
    const chapterNode: ChapterNode = {
      ...ch.chapterNode,
      id: chapterId,
      type: "chapter",
      parentId: null, // top-level
      tags: ch.chapterNode.tags ?? ch.chapterNode.tags ?? [],
    };

    nodeMap[chapterId] = chapterNode;
    order.push(chapterId);
    ensure(chapterId);

    for (const sc of ch.scenes) {
      const sceneId = sc.id;
      const sceneNode: SceneNode = {
        id: sceneId,
        type: "scene",
        parentId: chapterId,
        position: (nodeMap[sceneId] as any)?.position ?? { x: 0, y: 0 },
        title: sc.title,
        description: sc.description,
        tags: (nodeMap[sceneId] as any)?.tags ?? [],
      };

      nodeMap[sceneId] = sceneNode;
      ensure(sceneId);
      childrenOrder[chapterId].push(sceneId);

      // First pass: put TEXT nodes in scene order
      for (const n of sc.nodes) {
        if (n.type === "text") {
          const t = n as TextNode;
          const textNode: TextNode = {
            ...t,
            parentId: sceneId,
            tags: t.tags ?? [],
            images: t.images ?? [],
            summary: t.summary,
            sticker: t.sticker, // keep sticker if any
          };
          nodeMap[textNode.id] = textNode;
          ensure(textNode.id); // may hold media as children
          childrenOrder[sceneId].push(textNode.id);
        }
      }

      // Second pass: place MEDIA
      for (const n of sc.nodes) {
        if (n.type === "text") continue;

        if (n.type === "picture" || n.type === "annotation" || n.type === "event") {
          const media = n as PictureNode | AnnotationNode | EventNode;
          // Determine best parent:
          // 1) If old data had a parentId that points to a TEXT, use it.
          // 2) Else parent to the SCENE (legacy behavior).
          let parentId = (media as any).parentId as string | null | undefined;
          const isValidTextParent =
            parentId && nodeMap[parentId] && nodeMap[parentId].type === "text";

          if (!isValidTextParent) {
            parentId = sceneId; // fallback
          }

          const placed = {
            ...media,
            parentId,
            tags: (media as any).tags ?? [],
          } as typeof media;

          nodeMap[placed.id] = placed;
          ensure(parentId!);
          childrenOrder[parentId!].push(placed.id);
        }
      }
    }
  }

  return {
    title: old.title ?? "Untitled Story",
    nodeMap,
    order,
    childrenOrder,
  };
}

/**
 * Loads a .zip file containing story.json + /images folder,
 * restores story (flat) and image state. Accepts BOTH flat and old nested stories.
 */
export const importProjectFromZip = async (file: File) => {
  console.log("📥 [Import] Importing ZIP:", file.name);

  const confirmReplace = window.confirm(
    "Importing will replace your current story and images. This action can be undone. Continue?"
  );
  if (!confirmReplace) return;

  const zip = await JSZip.loadAsync(file);
  const imageStore = useImageStore.getState();
  const storyStore = useStoryStore.getState();

  // 🧠 Snapshot current state for undo
  storyStore.pushHistory();

  // 🧼 Clear current images (keep story until we parsed JSON successfully)
  imageStore.clearImages();

  let importedStoryRaw: unknown = null;
  const importedImages: Record<string, string> = {};

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (path.endsWith(".json")) {
      const jsonText = await zipEntry.async("text");
      importedStoryRaw = JSON.parse(jsonText);
    } else if (path.startsWith("images/")) {
      const blob = await zipEntry.async("blob");
      const fileName = path.split("/").pop()!;
      const nodeId = fileName.split(".")[0];
      const base64 = await blobToBase64(blob);
      importedImages[nodeId] = base64;
    }
  }

  if (!importedStoryRaw) {
    console.error("❌ [Import] No story.json found in ZIP");
    alert("Failed to import: Missing story.json file in ZIP.");
    return;
  }

  // 🔍 Detect shape: flat vs nested
  const maybeFlat = importedStoryRaw as Partial<Story>;
  const maybeNested = importedStoryRaw as Partial<OldNestedStory>;

  let importedFlat: Story;

  if (maybeFlat && maybeFlat.nodeMap && maybeFlat.order && maybeFlat.childrenOrder) {
    console.log("🧭 [Import] Detected FLAT story shape.");
    importedFlat = maybeFlat as Story;
  } else if (maybeNested && Array.isArray(maybeNested.chapters)) {
    console.log("🧭 [Import] Detected OLD NESTED story shape. Converting...");
    importedFlat = nestedToFlatStory(maybeNested as OldNestedStory);
    console.log("🔄 [Import] Conversion complete:", {
      chapters: importedFlat.order.length,
      nodes: Object.keys(importedFlat.nodeMap).length,
    });
  } else {
    console.error("❌ [Import] Unknown story format. Aborting.");
    alert("Failed to import: Unknown story.json format.");
    return;
  }

  // ✅ Apply story + images
  console.log("🧼 [Import] Replacing story state and images…");
  useStoryStore.setState({ story: importedFlat, selectedNodeId: null, future: [] });
  useImageStore.getState().setImages(importedImages);

  console.log("📷 [Import] Images loaded into imageStore:", Object.keys(importedImages));
  console.log("✅ [Import] Story + images restored from ZIP");
};
