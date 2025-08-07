import JSZip from "jszip";
import type { Story } from "../../../../context/storyStore/types";
import { useStoryStore } from "../../../../context/storyStore/storyStore";
import { useImageStore } from "../../../../context/imageStore/imageStore";

/**
 * Loads a .zip file containing story.json + /images folder,
 * restores story and image state.
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

  // 🧼 Clear current state
  imageStore.clearImages();
  storyStore.resetStory();

  let importedStory: Story | null = null;
  const importedImages: Record<string, string> = {};

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (path.endsWith(".json")) {
      const jsonText = await zipEntry.async("text");
      importedStory = JSON.parse(jsonText) as Story;
    } else if (path.startsWith("images/")) {
      const blob = await zipEntry.async("blob");
      const fileName = path.split("/").pop()!;
      const nodeId = fileName.split(".")[0];
      const base64 = await blobToBase64(blob);
      importedImages[nodeId] = base64;
    }
  }

  if (importedStory) {
    storyStore.setStory(importedStory, true); // ✅ Import with undo support
    useImageStore.getState().setImages(importedImages); // ✅ Restore images
    console.log("📷 [Import] Images loaded into imageStore:", Object.keys(importedImages));
    console.log("✅ [Import] Story + images restored from ZIP");
  } else {
    console.error("❌ [Import] No story.json found in ZIP");
    alert("Failed to import: Missing story.json file in ZIP.");
  }
};
