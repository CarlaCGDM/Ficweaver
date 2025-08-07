import { useState, useEffect, useRef } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import type { NodeData } from "../../../context/storyStore/types";
import {
  outlinePanelContainer,
  scrollContainer,
} from "./outlinePanelStyles";
import ChapterItem from "./ChapterItem";
import OutlineToolbar from "./OutlineToolbar";
import OutlineHeader from "./OutlineHeader";
import OutlineControls from "./OutlineControls";
import { exportProjectAsZip } from "./utils/exportProjectAsZip";
import { importProjectFromZip } from "./utils/importProjectFromZip";
import { useImageStore } from "../../../context/imageStore/imageStore";

interface OutlinePanelProps {
  onFocusNode: (nodeId: string) => void;
  onEditNode: (node: NodeData) => void;
  focusedNodeId?: string;
}

export default function OutlinePanel({
  onFocusNode,
  onEditNode,
  focusedNodeId,
}: OutlinePanelProps) {
  const story = useStoryStore((state) => state.story) ?? { title: "", chapters: [] };
  const updateStoryTitle = useStoryStore((state) => state.updateStoryTitle);
  const addChapter = useStoryStore((state) => state.addChapter);

  const [showActionButtons, setShowActionButtons] = useState(false);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [openScenes, setOpenScenes] = useState<Record<string, boolean>>({});

  // ✅ Scroll refs
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // ✅ Expand relevant chapter/scene when focus changes and scroll into view
  useEffect(() => {
    if (!focusedNodeId) return;

    let updatedChapters: Record<string, boolean> = {};
    let updatedScenes: Record<string, boolean> = {};

    for (const chapter of story.chapters) {
      if (chapter.chapterNode.id === focusedNodeId || chapter.id === focusedNodeId) {
        updatedChapters = { [chapter.id]: true };
        updatedScenes = {};
        break;
      }

      for (const scene of chapter.scenes) {
        const sceneNode = scene.nodes.find((n) => n.type === "scene");
        if (
          scene.id === focusedNodeId ||
          sceneNode?.id === focusedNodeId ||
          scene.nodes.some((n) => n.id === focusedNodeId)
        ) {
          updatedChapters = { [chapter.id]: true };
          updatedScenes = { [scene.id]: true };
          break;
        }
      }
      if (Object.keys(updatedChapters).length) break;
    }

    setOpenChapters(updatedChapters);
    setOpenScenes(updatedScenes);

    // ✅ Scroll focused node into center view
    if (focusedNodeId && nodeRefs.current[focusedNodeId]) {
      nodeRefs.current[focusedNodeId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [focusedNodeId, story.chapters]);

  const handleEditStoryTitle = () => {
    const newTitle = window.prompt("Edit Story Title:", story.title);
    if (newTitle && newTitle.trim() !== "") updateStoryTitle(newTitle.trim());
  };

  const handleNewStory = () => {
    const confirmNew = window.confirm(
      "Starting a new story will clear your current story and images. This action can be undone. Continue?"
    );
    if (!confirmNew) return;

    const storyStore = useStoryStore.getState();
    const imageStore = useImageStore.getState();

    storyStore.pushHistory();
    imageStore.clearImages();
    storyStore.setStory({ title: "Untitled Story", chapters: [] }, true);
  };

  const handleExportZip = () => exportProjectAsZip(story);

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importProjectFromZip(file);
    e.target.value = "";
  };

  return (
    <div style={outlinePanelContainer}>
      {/* 🔒 Fixed Toolbar */}
      <OutlineToolbar
        onExport={handleExportZip}
      />

      {/* 🧾 Scrollable Content */}
      <div ref={containerRef} style={scrollContainer}>
        {/* Header */}
        <OutlineHeader title={story.title} onEditTitle={handleEditStoryTitle} />

        {/* Controls */}
        <OutlineControls
          chapters={story.chapters}
          focusedNodeId={focusedNodeId}
          openChapters={openChapters}
          setOpenChapters={setOpenChapters}
          setOpenScenes={setOpenScenes}
          onAddChapter={addChapter}
          showActionButtons={showActionButtons}
          setShowActionButtons={setShowActionButtons}
        />

        {/* Chapter List */}
        <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
          {story.chapters.map((ch, index) => (
            <ChapterItem
              key={ch.id}
              chapter={ch}
              chapterIndex={index}
              focusedNodeId={focusedNodeId}
              onFocusNode={onFocusNode}
              onEditNode={onEditNode}
              showActionButtons={showActionButtons}
              isOpen={openChapters[ch.id] === true}
              onToggleOpen={() =>
                setOpenChapters((prev) => ({
                  ...prev,
                  [ch.id]: !prev[ch.id],
                }))
              }
              openScenes={openScenes}
              nodeRefs={nodeRefs}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
