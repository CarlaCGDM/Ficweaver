import { Plus, Save, Upload } from "lucide-react";
import { toolbarContainer, toolbarBtnStyle } from "./outlinePanelStyles";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { useImageStore } from "../../../context/imageStore/imageStore";
import { importProjectFromZip } from "./utils/importProjectFromZip";

export default function OutlineToolbar({ onExport }: { onExport: () => void }) {
  const resetStory = useStoryStore((state) => state.resetStory);
  const clearImages = useImageStore((state) => state.clearImages);

  // ✅ Handle new story
  const handleNewStory = () => {
    if (window.confirm("Are you sure you want to start a new story? Unsaved changes will be lost.")) {
      resetStory();
      clearImages();
    }
  };

  // ✅ Handle import from file
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importProjectFromZip(file);
    } catch (err) {
      console.error("Import failed", err);
      alert("Something went wrong during import.");
    }

    e.target.value = ""; // ✅ Reset input to allow same file reselect
  };

  return (
    <div style={toolbarContainer}>
      <button
        style={toolbarBtnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        onClick={handleNewStory}
      >
        <Plus size={16} /> New
      </button>

      <button
        style={toolbarBtnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        onClick={onExport}
      >
        <Save size={16} /> Save
      </button>

      <label
        style={{ ...toolbarBtnStyle, cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Upload size={16} /> Load
        <input
          type="file"
          accept=".json,.zip"
          style={{ display: "none" }}
          onChange={handleImport}
        />
      </label>
    </div>
  );
}
