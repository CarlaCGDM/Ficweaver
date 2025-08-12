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
import { useImageStore } from "../../../context/imageStore/imageStore";
import { safeScrollToCenter } from "../utils/safeScrollToCenter";
import { getOpenStatesFromFocus, getChaptersInOrder } from "./utils/outlineHelpers";

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
  const story = useStoryStore((state) => state.story);
  const updateStoryTitle = useStoryStore((state) => state.updateStoryTitle);
  const createChapter = useStoryStore((state) => state.createChapter);

  const [showActionButtons, setShowActionButtons] = useState(false);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [openScenes, setOpenScenes] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // ✅ Expand relevant chapter/scene when focus changes and scroll into view
  useEffect(() => {
    if (!focusedNodeId) return;
    const { openChapters, openScenes } = getOpenStatesFromFocus(story, focusedNodeId);
    setOpenChapters(openChapters);
    setOpenScenes(openScenes);

    if (focusedNodeId && nodeRefs.current[focusedNodeId]) {
      const scroller = containerRef.current;
      const el = nodeRefs.current[focusedNodeId]!;
      if (scroller) safeScrollToCenter(scroller, el);
    }
  }, [focusedNodeId, story]);

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
    storyStore.setStory(
      { title: "Untitled Story", nodeMap: {}, order: [], childrenOrder: {} },
      true
    );
  };

  const handleExportZip = () => exportProjectAsZip(story);

  const chapters = getChaptersInOrder(story);

  return (
    <div style={outlinePanelContainer}>
      <OutlineToolbar onExport={handleExportZip} />

      <div ref={containerRef} style={scrollContainer}>
        <OutlineHeader title={story.title} onEditTitle={handleEditStoryTitle} />

        <OutlineControls
          chapters={chapters}
          focusedNodeId={focusedNodeId}
          openChapters={openChapters}
          setOpenChapters={setOpenChapters}
          setOpenScenes={setOpenScenes}
          onAddChapter={() => createChapter("New Chapter")}
          showActionButtons={showActionButtons}
          setShowActionButtons={setShowActionButtons}
        />

        <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
          {chapters.map((ch, index) => (
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
