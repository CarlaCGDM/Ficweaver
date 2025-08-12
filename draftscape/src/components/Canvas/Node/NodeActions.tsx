// NodeActions.tsx
import { useMemo, useState } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import type {
  NodeData,
  ChapterNode,
  SceneNode,
  TextNode,
  PictureNode,
  AnnotationNode,
  EventNode,
  Story,
} from "../../../context/storyStore/types";
import { Edit3, Trash2, Plus, Route } from "lucide-react";
import { useTheme } from "../../../context/themeProvider/ThemeProvider";
import { useConnectStore, computeTargets } from "../../../context/uiStore/connectStore";

interface NodeActionsProps {
  nodeId: string;
  onEditNode: (node: NodeData) => void;
}

type AnyMedia = PictureNode | AnnotationNode | EventNode;
const isMedia = (t: NodeData["type"]) =>
  t === "picture" || t === "annotation" || t === "event";

// ---------- helpers (flat data model) ----------
function getNode(story: Story, id: string | undefined | null): NodeData | undefined {
  return id ? story.nodeMap[id] : undefined;
}

function findParentSceneId(story: Story, id: string): string | null {
  for (const [parentId, kids] of Object.entries(story.childrenOrder)) {
    if (kids?.includes(id)) {
      const parent = story.nodeMap[parentId];
      if (parent?.type === "scene") return parentId;
    }
  }
  return null;
}

function findParentChapterIdFromScene(story: Story, sceneId: string): string | null {
  for (const [parentId, kids] of Object.entries(story.childrenOrder)) {
    if (kids?.includes(sceneId)) {
      const parent = story.nodeMap[parentId];
      if (parent?.type === "chapter") return parentId;
    }
  }
  return null;
}

function lastNonMediaChildIdInScene(story: Story, sceneId: string): string | null {
  const arr = story.childrenOrder[sceneId] ?? [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const n = story.nodeMap[arr[i]];
    if (n && (n.type === "scene" || n.type === "text")) return n.id;
  }
  return null;
}

function lastSceneIdInChapter(story: Story, chapterId: string): string | null {
  const kids = story.childrenOrder[chapterId] ?? [];
  const scenes = kids.filter((id) => story.nodeMap[id]?.type === "scene");
  return scenes.length ? scenes[scenes.length - 1] : null;
}

export default function NodeActions({ nodeId, onEditNode }: NodeActionsProps) {
  const story = useStoryStore((s) => s.story);

  // create*
  const createChapter = useStoryStore((s) => s.createChapter);
  const createScene = useStoryStore((s) => s.createScene);
  const createText = useStoryStore((s) => s.createText);
  const createPicture = useStoryStore((s) => s.createPicture);
  const createAnnotation = useStoryStore((s) => s.createAnnotation);
  const createEvent = useStoryStore((s) => s.createEvent);

  // delete*
  const deleteChapter = useStoryStore((s) => s.deleteChapter);
  const deleteScene = useStoryStore((s) => s.deleteScene);
  const deleteText = useStoryStore((s) => s.deleteText);
  const deletePicture = useStoryStore((s) => s.deletePicture);
  const deleteAnnotation = useStoryStore((s) => s.deleteAnnotation);
  const deleteEvent = useStoryStore((s) => s.deleteEvent);

  // theme palette for button colors (unchanged visuals)
  const { theme, mode } = useTheme();
  const chapterColors = theme.chapterColors?.[mode] ?? [];
  const getChapterColor = (i: number) =>
    chapterColors[i] ?? `var(--chapter-color-${i + 1})`;

  const buttonPalette = {
    chapter: getChapterColor(0),
    picture: getChapterColor(1),
    text: getChapterColor(2),
    scene: getChapterColor(3),
    annotation: getChapterColor(4),
    event: chapterColors[5] ?? "var(--color-accent)",
  };

  const [hovered, setHovered] = useState(false);

  // Connect

  const { startConnect } = useConnectStore();

  const handleStartReconnect = () => {
    // Chapters/scenes/texts/media are allowed sources. (No-op for others if you want.)
    const targets = computeTargets(story, node.id);
    if (Object.keys(targets).length === 0) return;
    startConnect(node.id, targets);
  };

  // ---------- derive hierarchy from flat model ----------
  const derived = useMemo(() => {
    const node = getNode(story, nodeId);
    if (!node) return null;

    let parentSceneId: string | null = null;
    let parentChapterId: string | null = null;

    if (node.type === "chapter") {
      // top-level
    } else if (node.type === "scene") {
      // ✅ treat the clicked scene as the owning scene for add‑text/media
      parentSceneId = node.id;
      parentChapterId = findParentChapterIdFromScene(story, node.id);
    } else {
      // text or media: find its scene, then chapter
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

  const media = isMedia(node.type);
  const inScene = !!parentScene;
  const inChapter = !!parentChapter;

  // ---------- visibility rules (match your previous UX) ----------
  const showNewText =
    !media && (node.type === "scene" || node.type === "text");

  const showNewScene =
    !media && (
      node.type === "chapter" ||
      node.type === "scene" ||
      (node.type === "text" &&
        parentScene &&
        lastNonMediaChildIdInScene(story, parentScene.id) === node.id)
    );

  const showNewChapter =
    !media &&
    (() => {
      if (!parentChapter) return node.type === "chapter"; // lone chapter header
      // "new chapter after" only when we're at the last non-media item of last scene in chapter
      const lastSceneId = lastSceneIdInChapter(story, parentChapter.id);
      if (!lastSceneId) return node.type === "chapter";
      const lastNonMedia = lastNonMediaChildIdInScene(story, lastSceneId);
      return lastNonMedia === node.id;
    })();

  // ---------- handlers ----------

  const handleAddText = () => {
    if (!parentScene) return;

    if (node.type === "scene") {
      // insert at top of scene
      createText(parentScene.id, undefined, { atStart: true });
    } else {
      // node is a text → insert after this text
      createText(parentScene.id, node.id);
    }
  };

  const handleAddScene = () => {
    if (node.type === "chapter") {
      // Insert at the *top* of this chapter
      createScene(node.id, "New Scene", undefined, { atStart: true });
      return;
    }

    if (node.type === "scene") {
      // Insert *after* this scene in the same chapter
      const chapterId = parentChapter?.id ?? null;
      if (!chapterId) return;
      createScene(chapterId, "New Scene", node.id);
      return;
    }

    if (node.type === "text") {
      // Only allowed when this text is the last non‑media in its scene (visibility already ensures it)
      const chapterId = parentChapter?.id ?? null;
      const sceneId = parentScene?.id ?? null;
      if (!chapterId || !sceneId) return;

      // Insert the new scene *after the current scene*
      createScene(chapterId, "New Scene", sceneId);
      return;
    }
  };

  const handleAddChapter = () => {
    createChapter("New Chapter", node.id);
  };

  const mediaParentId = (() => {
    if (node.type === "chapter") return node.id;
    if (node.type === "scene") return node.id;
    if (node.type === "text") return node.id;
    return null; // no media from media nodes
  })();

  const handleAddPicture = () => {
    if (!mediaParentId) return;
    createPicture(mediaParentId); // no insertAfterId
  };

  const handleAddAnnotation = () => {
    if (!mediaParentId) return;
    createAnnotation(mediaParentId); // no insertAfterId
  };

  const handleAddEvent = () => {
    if (!mediaParentId) return;
    createEvent(mediaParentId); // no insertAfterId
  };

  const handleEditNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditNode(node);
  };

  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this node?")) return;
    switch (node.type) {
      case "chapter":
        deleteChapter(node.id);
        break;
      case "scene":
        deleteScene(node.id);
        break;
      case "text":
        deleteText(node.id);
        break;
      case "picture":
        deletePicture(node.id);
        break;
      case "annotation":
        deleteAnnotation(node.id);
        break;
      case "event":
        deleteEvent(node.id);
        break;
    }
  };

  // ---------- UI (unchanged layout/positions) ----------
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
          {/* Edit / Delete vertical stack */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              right: "-5px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <button onClick={handleEditNode} style={editDeleteBtnStyle}>
              <Edit3 size={18} />
            </button>
            <button onClick={handleDeleteNode} style={editDeleteBtnStyle}>
              <Trash2 size={18} />
            </button>
            <button onClick={handleStartReconnect} style={editDeleteBtnStyle}>
              <Route size={18} />
            </button>
          </div>

          {/* Add buttons row */}
          {!media && (
            <div
              style={{
                position: "absolute",
                top: "-2px",
                right: "40px",
                display: "flex",
                flexDirection: "row",
                gap: "6px",
              }}
            >
              {showNewChapter && (
                <button title={"Insert new chapter"} onClick={handleAddChapter} style={addBtnStyle(buttonPalette.chapter)}>
                  <Plus size={16} /> 📘
                </button>
              )}
              {showNewScene && (
                <button title={"Insert new scene"} onClick={handleAddScene} style={addBtnStyle(buttonPalette.scene)}>
                  <Plus size={16} /> 🎬
                </button>
              )}
              {showNewText && (
                <button title={"Insert new text"} onClick={handleAddText} style={addBtnStyle(buttonPalette.text)}>
                  <Plus size={16} /> 📝
                </button>
              )}
              <button title={"Add picture"} onClick={handleAddPicture} style={addBtnStyle(buttonPalette.picture)}>
                <Plus size={16} /> 🖼️
              </button>
              <button title={"Add annotation"} onClick={handleAddAnnotation} style={addBtnStyle(buttonPalette.annotation)}>
                <Plus size={16} /> 💬
              </button>
              <button
                disabled
                style={{ ...addBtnStyle(buttonPalette.chapter), opacity: 0.5 }}
                title="Audio coming soon"
              >
                <Plus size={16} /> 🎵
              </button>
              <button title={"Add event"} onClick={handleAddEvent} style={addBtnStyle(buttonPalette.event)}>
                <Plus size={16} /> ⏱️
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Theme-aware base styles (unchanged visuals) */
const editDeleteBtnStyle: React.CSSProperties = {
  background: "var(--color-panelAlt)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  borderRadius: "4px",
  width: "35px",
  height: "35px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const addBtnStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  color: "var(--color-accentText)",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  padding: "6px 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: "14px",
});
