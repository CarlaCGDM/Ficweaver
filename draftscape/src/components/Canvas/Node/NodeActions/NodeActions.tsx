import { useMemo, useState } from "react";
import { Edit3, Trash2, Plus, Route } from "lucide-react";

import { useStoryStore } from "../../../../context/storyStore/storyStore";
import type {
  NodeData,
  ChapterNode,
  SceneNode,
  Story,
} from "../../../../context/storyStore/types";
import { useTheme } from "../../../../context/themeProvider/ThemeProvider";
import { useConnectStore, computeTargets } from "../../../../context/uiStore/connectStore";

import {
  applyTextInsertGap,
  applySceneInsertGap,
  applyChapterInsertGapX,
  alignChapterBesidePrevious,
  INSERT_GAP_TEXT_Y,
  INSERT_GAP_SCENE_Y,
  INSERT_GAP_CHAPTER_X,
} from "../../../../context/storyStore/layoutShifts";

import NodeActionsButton from "./NodeActionsButton";

// utils
import {
  getNode,
  findParentSceneId,
  findParentChapterIdFromScene,
  lastTextIdInScene,
  lastSceneIdInChapter,
} from "./hierarchy";
import {
  cloneStory,
  findNewId,
  placeBelowFlush,
} from "./placement";
import {
  canShowNewText,
  canShowNewScene,
  canShowNewChapter,
} from "./visibility";

type AnyMediaType = "picture" | "annotation" | "event";
const isMediaType = (t: NodeData["type"]): t is AnyMediaType =>
  t === "picture" || t === "annotation" || t === "event";

interface NodeActionsProps {
  nodeId: string;
  onEditNode: (node: NodeData) => void;
}

export default function NodeActions({ nodeId, onEditNode }: NodeActionsProps) {
  const story = useStoryStore((s) => s.story);
  const setStoryNoHistory = useStoryStore((s) => s.setStoryNoHistory);

  // CRUD
  const createChapter = useStoryStore((s) => s.createChapter);
  const createScene = useStoryStore((s) => s.createScene);
  const createText = useStoryStore((s) => s.createText);
  const createPicture = useStoryStore((s) => s.createPicture);
  const createAnnotation = useStoryStore((s) => s.createAnnotation);
  const createEvent = useStoryStore((s) => s.createEvent);

  const deleteChapter = useStoryStore((s) => s.deleteChapter);
  const deleteScene = useStoryStore((s) => s.deleteScene);
  const deleteText = useStoryStore((s) => s.deleteText);
  const deletePicture = useStoryStore((s) => s.deletePicture);
  const deleteAnnotation = useStoryStore((s) => s.deleteAnnotation);
  const deleteEvent = useStoryStore((s) => s.deleteEvent);

  // theme palette (for button colors)
  const { theme, mode } = useTheme();
  const palette = theme.chapterColors?.[mode] ?? [];
  const colorToken = (i: number) => palette[i] ?? `var(--chapter-color-${i + 1})`;
  const buttonPalette = {
    chapter: colorToken(0),
    picture: colorToken(1),
    text:    colorToken(2),
    scene:   colorToken(3),
    annotation: colorToken(4),
    event:   palette[5] ?? "var(--color-accent)",
  };

  const [hovered, setHovered] = useState(false);

  // reconnect
  const { startConnect } = useConnectStore();

  // derive context
  const derived = useMemo(() => {
    const node = getNode(story, nodeId);
    if (!node) return null;

    let parentSceneId: string | null = null;
    let parentChapterId: string | null = null;

    if (node.type === "scene") {
      parentSceneId = node.id;
      parentChapterId = findParentChapterIdFromScene(story, node.id);
    } else if (node.type !== "chapter") {
      parentSceneId = findParentSceneId(story, node.id);
      if (parentSceneId) {
        parentChapterId = findParentChapterIdFromScene(story, parentSceneId);
      }
    }

    const parentScene = getNode(story, parentSceneId) as SceneNode | undefined;
    const parentChapter = getNode(story, parentChapterId) as ChapterNode | undefined;

    return { node, parentScene, parentChapter };
  }, [story, nodeId]);

  if (!derived) return null;
  const { node, parentScene, parentChapter } = derived;

  const media = isMediaType(node.type);

  // visibility
  const showNewText = !media && canShowNewText(node);
  const showNewScene = !media && canShowNewScene(story, node);
  const showNewChapter = !media && canShowNewChapter(story, node);

  // handlers
  const handleStartReconnect = () => {
    const targets = computeTargets(story, node.id);
    if (Object.keys(targets).length === 0) return;
    startConnect(node.id, targets);
  };

  const handleAddText = () => {
    if (!parentScene) return;

    const before = useStoryStore.getState().story;

    if (node.type === "scene") {
      // insert at top of scene
      createText(parentScene.id, undefined, { atStart: true });
    } else {
      // insert after this text
      createText(parentScene.id, node.id);
    }

    const after = useStoryStore.getState().story;
    const newTextId = findNewId(before, after);
    if (!newTextId) return;

    const s = cloneStory(after);

    if (node.type === "scene") {
      // place exactly below scene header
      placeBelowFlush(s, newTextId, parentScene.id, parentScene.id);
    } else {
      // place exactly below the clicked text’s true bottom
      placeBelowFlush(s, newTextId, node.id, parentScene.id);
    }

    // push later texts in scene by official gap only
    applyTextInsertGap(s, newTextId, INSERT_GAP_TEXT_Y);

    // avoid first-render auto-shift loop
    if ((s.nodeMap[newTextId] as any)?.pendingInitialShift) {
      s.nodeMap[newTextId] = { ...(s.nodeMap[newTextId] as any), pendingInitialShift: false };
    }

    setStoryNoHistory(s);
  };

  const handleAddScene = () => {
    const before = useStoryStore.getState().story;

    if (node.type === "chapter") {
      createScene(node.id, "New Scene", undefined, { atStart: true });
    } else if (node.type === "scene") {
      const chId = parentChapter?.id ?? null;
      if (!chId) return;
      createScene(chId, "New Scene", node.id);
    } else if (node.type === "text") {
      const chId = parentChapter?.id ?? null;
      const scId = parentScene?.id ?? null;
      if (!chId || !scId) return;
      createScene(chId, "New Scene", scId); // after current scene
    }

    const after = useStoryStore.getState().story;
    const newSceneId = findNewId(before, after);
    if (!newSceneId) return;

    const s = cloneStory(after);

    // If inserting after a scene/text, anchor is: last text of the previous scene OR the scene header
    if (node.type === "scene" || node.type === "text") {
      const prevSceneId = node.type === "scene" ? node.id : parentScene?.id ?? null;
      if (prevSceneId) {
        const lastText = lastTextIdInScene(s, prevSceneId);
        const anchorId = lastText ?? prevSceneId;
        placeBelowFlush(s, newSceneId, anchorId, prevSceneId);
      }
    }

    // apply official spacing for later scenes
    applySceneInsertGap(s, newSceneId, INSERT_GAP_SCENE_Y);

    setStoryNoHistory(s);
  };

  const handleAddChapter = () => {
    const before = useStoryStore.getState().story;

    // insert after the current chapter context
    createChapter("New Chapter", node.id);

    const after = useStoryStore.getState().story;
    const newId = findNewId(before, after);
    if (!newId) return;

    const s = cloneStory(after);

    // align new chapter beside previous, then push subsequent chapters by official X gap
    alignChapterBesidePrevious(s, newId, INSERT_GAP_CHAPTER_X);
    applyChapterInsertGapX(s, newId, INSERT_GAP_CHAPTER_X);

    setStoryNoHistory(s);
  };

  const handleAddPicture = () => {
    if (node.type === "chapter" || node.type === "scene" || node.type === "text") {
      createPicture(node.id);
    }
  };
  const handleAddAnnotation = () => {
    if (node.type === "chapter" || node.type === "scene" || node.type === "text") {
      createAnnotation(node.id);
    }
  };
  const handleAddEvent = () => {
    if (node.type === "chapter" || node.type === "scene" || node.type === "text") {
      createEvent(node.id);
    }
  };

  const handleEditNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditNode(node);
  };

  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this node?")) return;
    switch (node.type) {
      case "chapter":   deleteChapter(node.id); break;
      case "scene":     deleteScene(node.id); break;
      case "text":      deleteText(node.id); break;
      case "picture":   deletePicture(node.id); break;
      case "annotation":deleteAnnotation(node.id); break;
      case "event":     deleteEvent(node.id); break;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "-40px",
        right: "-40px",
        width: "calc(100% + 50px)",
        height: "calc(100% + 90px)",
        zIndex: 300,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <>
          {/* Edit/Delete/Connect */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              right: "-10px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <NodeActionsButton title="Edit" onClick={handleEditNode}>
              <Edit3 size={18} />
            </NodeActionsButton>

            <NodeActionsButton title="Delete" onClick={handleDeleteNode}>
              <Trash2 size={18} />
            </NodeActionsButton>

            <NodeActionsButton title="Reconnect" onClick={handleStartReconnect}>
              <Route size={18} />
            </NodeActionsButton>
          </div>

          {/* Add row */}
          {!media && (
            <div
              style={{
                position: "absolute",
                top: "-2px",
                right: "40px",
                display: "flex",
                gap: "6px",
              }}
            >
              {showNewChapter && (
                <NodeActionsButton title="Insert chapter" onClick={handleAddChapter} bg={buttonPalette.chapter}>
                  <Plus size={16} /> <span style={{ marginLeft: 4 }}>📘</span>
                </NodeActionsButton>
              )}
              {showNewScene && (
                <NodeActionsButton title="Insert scene" onClick={handleAddScene} bg={buttonPalette.scene}>
                  <Plus size={16} /> <span style={{ marginLeft: 4 }}>🎬</span>
                </NodeActionsButton>
              )}
              {showNewText && (
                <NodeActionsButton title="Insert text" onClick={handleAddText} bg={buttonPalette.text}>
                  <Plus size={16} /> <span style={{ marginLeft: 4 }}>📝</span>
                </NodeActionsButton>
              )}
              <NodeActionsButton title="Add picture" onClick={handleAddPicture} bg={buttonPalette.picture}>
                <Plus size={16} /> <span style={{ marginLeft: 4 }}>🖼️</span>
              </NodeActionsButton>
              <NodeActionsButton title="Add annotation" onClick={handleAddAnnotation} bg={buttonPalette.annotation}>
                <Plus size={16} /> <span style={{ marginLeft: 4 }}>💬</span>
              </NodeActionsButton>
              <NodeActionsButton title="Add event" onClick={handleAddEvent} bg={buttonPalette.event}>
                <Plus size={16} /> <span style={{ marginLeft: 4 }}>⏱️</span>
              </NodeActionsButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
