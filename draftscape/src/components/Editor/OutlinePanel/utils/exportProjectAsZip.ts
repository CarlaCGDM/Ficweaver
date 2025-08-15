// src/components/Editor/ProjectIO/exportProjectAsZip.ts
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { Story } from "../../../../context/storyStore/types";
import { useImageStore } from "../../../../context/imageStore/imageStore";

/**
 * Exports the story (flat shape) and associated images as a .zip file.
 */
export const exportProjectAsZip = async (story: Story) => {
  console.log("📦 [Export] Export triggered");
  console.log("📦 [Export] Story title:", story.title);
  console.log("📦 [Export] Top-level chapters:", story.order.length);
  console.log("📦 [Export] nodeMap size:", Object.keys(story.nodeMap).length);

  const { imageMap } = useImageStore.getState();
  console.log("🖼 [Export] Images in store:", Object.keys(imageMap));

  try {
    const zip = new JSZip();

    // ✅ Add JSON story data (flat)
    const storyFileName = `story.json`;
    console.log("📄 [Export] Adding JSON file:", storyFileName);
    zip.file(storyFileName, JSON.stringify(story, null, 2));

    // ✅ Add images folder
    const imagesFolder = zip.folder("images");
    if (!imagesFolder) {
      console.warn("⚠ [Export] Could not create images folder in ZIP");
    }

    // ✅ Process each image (keyed by picture node id)
    for (const [nodeId, base64Data] of Object.entries(imageMap)) {
      if (!base64Data) continue;

      // Extract MIME type & extension
      const mimeMatch = base64Data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const extension = mimeMatch ? mimeMatch[1].split("/")[1] : "png";

      console.log(`🖼 [Export] Adding image: ${nodeId}.${extension}`);

      // Strip base64 header and decode to binary
      const base64 = base64Data.split(",")[1];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Add binary file to ZIP
      imagesFolder?.file(`${nodeId}.${extension}`, byteArray);
    }

    // ✅ Generate ZIP
    console.log("📦 [Export] Generating ZIP...");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    console.log("✅ [Export] ZIP Blob generated:", zipBlob);

    // ✅ Download ZIP
    const zipFileName = `${(story.title || "My Story")
      .replace(/\s+/g, "_")
      .replace(/[^\w_]/g, "")}_Ficweaver.zip`;
    console.log("⬇️ [Export] Triggering download:", zipFileName);
    saveAs(zipBlob, zipFileName);
    console.log("✅ [Export] Download triggered successfully");
  } catch (error) {
    console.error("❌ [Export] Failed to export ZIP:", error);
  }
};
