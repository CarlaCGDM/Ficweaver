import { Plus } from "lucide-react";
import { buttonStyle, controlsRowStyle } from "./outlinePanelStyles";
import type { Chapter } from "../../../context/storyStore/types";

interface OutlineControlsProps {
  chapters: Chapter[];
  focusedNodeId?: string;
  openChapters: Record<string, boolean>;
  setOpenChapters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOpenScenes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onAddChapter: () => void;
  showActionButtons: boolean;
  setShowActionButtons: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OutlineControls({
  chapters,
  focusedNodeId,
  openChapters,
  setOpenChapters,
  setOpenScenes,
  onAddChapter,
  showActionButtons,
  setShowActionButtons,
}: OutlineControlsProps) {
  const handleToggleAll = () => {
    const allOpen = Object.keys(openChapters).length === chapters.length;

    if (allOpen) {
      // Collapse all but keep focused chapter/scene open
      const preservedChapters: Record<string, boolean> = {};
      const preservedScenes: Record<string, boolean> = {};

      if (focusedNodeId) {
        for (const chapter of chapters) {
          if (
            chapter.chapterNode.id === focusedNodeId ||
            chapter.id === focusedNodeId ||
            chapter.scenes.some(
              (sc) =>
                sc.id === focusedNodeId ||
                sc.nodes.some((n) => n.id === focusedNodeId)
            )
          ) {
            preservedChapters[chapter.id] = true;
            for (const sc of chapter.scenes) {
              if (
                sc.id === focusedNodeId ||
                sc.nodes.some((n) => n.id === focusedNodeId)
              ) {
                preservedScenes[sc.id] = true;
                break;
              }
            }
            break;
          }
        }
      }

      setOpenChapters(preservedChapters);
      setOpenScenes(preservedScenes);
    } else {
      // Open all chapters while preserving focused scene
      const allOpenChapters: Record<string, boolean> = {};
      const preservedScenes: Record<string, boolean> = {};

      chapters.forEach((ch) => {
        allOpenChapters[ch.id] = true;
        if (
          focusedNodeId &&
          ch.scenes.some(
            (sc) =>
              sc.id === focusedNodeId ||
              sc.nodes.some((n) => n.id === focusedNodeId)
          )
        ) {
          const focusedScene = ch.scenes.find(
            (sc) =>
              sc.id === focusedNodeId ||
              sc.nodes.some((n) => n.id === focusedNodeId)
          );
          if (focusedScene) preservedScenes[focusedScene.id] = true;
        }
      });

      setOpenChapters(allOpenChapters);
      setOpenScenes(preservedScenes);
    }
  };

  return (
    <div style={controlsRowStyle}>
      <button style={buttonStyle} onClick={onAddChapter}>
        <Plus size={16} /> Chapter
      </button>

      <button style={buttonStyle} onClick={handleToggleAll}>
        {Object.keys(openChapters).length === chapters.length
          ? "Close All Chapters"
          : "Open All Chapters"}
      </button>

      <button
        disabled
        style={{ ...buttonStyle, opacity: 0.2, display: "none" }}
        onClick={() => setShowActionButtons((prev) => !prev)}
      >
        {showActionButtons ? "Hide Actions" : "Show Actions"}
      </button>
    </div>
  );
}
