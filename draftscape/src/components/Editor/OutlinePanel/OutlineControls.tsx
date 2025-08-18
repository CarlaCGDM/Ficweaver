// src/components/Outline/OutlineControls.tsx
import { Plus } from "lucide-react";
import { buttonStyle, controlsRowStyle } from "./outlinePanelStyles";
import type { Story, ChapterNode } from "../../../context/storyStore/types";

interface OutlineControlsProps {
  chaptersInOrder: ChapterNode[];                 // flat
  nodeMap: Story["nodeMap"];
  childrenOrder: Story["childrenOrder"];
  focusedNodeId?: string;
  openChapters: Record<string, boolean>;
  setOpenChapters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOpenScenes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onAddChapter: () => void;
  showActionButtons: boolean;
  setShowActionButtons: React.Dispatch<React.SetStateAction<boolean>>;
}

/** Find the parent scene id for a node (text/media) by scanning childrenOrder. */
function findParentSceneId(
  nodeMap: Story["nodeMap"],
  childrenOrder: Story["childrenOrder"],
  nodeId: string
): string | null {
  for (const [pid, kids] of Object.entries(childrenOrder)) {
    if (kids?.includes(nodeId)) {
      const p = nodeMap[pid];
      if (p?.type === "scene") return pid;
    }
  }
  return null;
}

/** Resolve the focused chapter id and (optionally) focused scene id from a node id. */
function resolveFocusedContext(
  nodeMap: Story["nodeMap"],
  childrenOrder: Story["childrenOrder"],
  focusedNodeId?: string
): { chapterId?: string; sceneId?: string } {
  if (!focusedNodeId) return {};
  const n = nodeMap[focusedNodeId];
  if (!n) return {};

  if (n.type === "chapter") {
    return { chapterId: n.id };
  }

  if (n.type === "scene") {
    // scenes store their parent chapter directly
    return { chapterId: n.parentId ?? undefined, sceneId: n.id };
  }

  // text / picture / annotation / event
  const sceneId = findParentSceneId(nodeMap, childrenOrder, focusedNodeId) ?? undefined;
  if (!sceneId) return {};
  const scene = nodeMap[sceneId];
  if (!scene || scene.type !== "scene") return {};
  return { chapterId: scene.parentId ?? undefined, sceneId };
}

export default function OutlineControls({
  chaptersInOrder,
  nodeMap,
  childrenOrder,
  focusedNodeId,
  openChapters,
  setOpenChapters,
  setOpenScenes,
  onAddChapter,
  showActionButtons,
  setShowActionButtons,
}: OutlineControlsProps) {
  // Flat: ordered list of chapter IDs comes from chaptersInOrder
  const chapterIds = chaptersInOrder.map((c) => c.id);

  const handleToggleAll = () => {
    const allOpen = Object.keys(openChapters).length === chapterIds.length;

    const { chapterId: focusedChapterId, sceneId: focusedSceneId } = resolveFocusedContext(
      nodeMap,
      childrenOrder,
      focusedNodeId
    );

    if (allOpen) {
      // Collapse all; preserve focused chapter/scene if any
      const preservedChapters: Record<string, boolean> = {};
      const preservedScenes: Record<string, boolean> = {};
      if (focusedChapterId) preservedChapters[focusedChapterId] = true;
      if (focusedSceneId) preservedScenes[focusedSceneId] = true;

      setOpenChapters(preservedChapters);
      setOpenScenes(preservedScenes);
    } else {
      // Open all chapters; ensure the focused scene stays open if any
      const allOpenCh: Record<string, boolean> = {};
      for (const chId of chapterIds) allOpenCh[chId] = true;

      const preservedScenes: Record<string, boolean> = {};
      if (focusedSceneId) preservedScenes[focusedSceneId] = true;

      setOpenChapters(allOpenCh);
      setOpenScenes(preservedScenes);
    }
  };

  return (
    <div style={controlsRowStyle}>
      <button style={buttonStyle} onClick={onAddChapter}>
        <Plus size={16} /> Chapter
      </button>

      <button style={buttonStyle} onClick={handleToggleAll}>
        {Object.keys(openChapters).length === chapterIds.length
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
