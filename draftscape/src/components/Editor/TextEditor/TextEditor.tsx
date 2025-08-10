import { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import type { Chapter, TextNode } from "../../../context/storyStore/types";
import { editorContainer } from "./textEditorStyles";
import TextEditorHeader from "./TextEditorHeader";
import SearchBar from "./SearchBar";
import TextEditorContent from "./TextEditorContent";
import { safeScrollToCenter } from "../utils/safeScrollToCenter";

export interface TextEditorRef {
  scrollToNode: (nodeId: string) => void;
}

interface TextEditorProps {
  onFocusNode: (nodeId: string) => void;
  focusedNodeId?: string; // Global focus state
}

const TextEditor = forwardRef<TextEditorRef, TextEditorProps>(
  ({ onFocusNode, focusedNodeId }, ref) => {
    const story = useStoryStore((state) => state.story);

    const [viewMode, setViewMode] = useState<"text" | "chronology">("text");

    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
    const [hoveredChapterId, setHoveredChapterId] = useState<string | null>(null);
    const [hoveredDetails, setHoveredDetails] = useState<any>(null);

    const [focusedSceneId, setFocusedSceneId] = useState<string | null>(null);

    useEffect(() => {
      if (!focusedNodeId) {
        console.log("🔄 TextEditor: Clearing focus immediately");
        setFocusedSceneId(null);
      }
    }, [focusedNodeId]);

    const [searchResults, setSearchResults] = useState<{
      chapters: string[];
      textNodes: string[];
      eventNodes: string[];
      searchQuery?: string;
    }>({ chapters: [], textNodes: [], eventNodes: [], searchQuery: "" });

    const [searchPerformed, setSearchPerformed] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useImperativeHandle(ref, () => ({
      scrollToNode(nodeId: string) {
        console.log("🔍 scrollToNode called with:", nodeId);

        let targetNodeId: string | null = null;
        let targetType: "text" | "chapter" | "scene" | "event" | null = null;
        let needsViewModeChange = false;

        // Check for event nodes first since they have special view requirements
        const eventHit = story.chapters
          .flatMap(ch => ch.scenes.flatMap(sc =>
            sc.nodes.filter(n => n.type === "event").map(n => ({ n, sc }))
          ))
          .find(({ n }) => n.id === nodeId);

        if (eventHit) {
          targetNodeId = eventHit.n.id;
          targetType = "event";
          setFocusedSceneId(eventHit.sc.id || null);
          needsViewModeChange = viewMode !== "chronology";
        } else {
          // Rest of your existing logic for other node types...
          // TEXT NODE
          const textNode = story.chapters
            .flatMap((ch) => ch.scenes.flatMap((sc) => sc.nodes))
            .find((n) => n.id === nodeId && n.type === "text");
          if (textNode) {
            targetNodeId = textNode.id;
            targetType = "text";
            const parentScene = story.chapters
              .flatMap((ch) => ch.scenes)
              .find((sc) => sc.nodes.some((n) => n.id === textNode.id));
            setFocusedSceneId(parentScene?.id || null);
            needsViewModeChange = viewMode !== "text";
          }

          // CHAPTER NODE
          if (!targetNodeId) {
            const chapter = story.chapters.find(
              (ch) => ch.chapterNode.id === nodeId || ch.id === nodeId
            );
            if (chapter) {
              targetNodeId = chapter.chapterNode.id;
              targetType = "chapter";
              setFocusedSceneId(null);
              needsViewModeChange = viewMode !== "text";
            }
          }

          // SCENE NODE
          if (!targetNodeId) {
            const scene = story.chapters
              .flatMap((ch) => ch.scenes)
              .find((sc) => sc.id === nodeId || sc.nodes.some((n) => n.id === nodeId));
            if (scene) {
              const firstText = scene.nodes.find((n) => n.type === "text");
              if (firstText) targetNodeId = firstText.id;
              targetType = "scene";
              setFocusedSceneId(scene.id);
              needsViewModeChange = viewMode !== "text";
            }
          }
        }

        const doScroll = () => {
          if (targetNodeId && nodeRefs.current[targetNodeId]) {
            const scroller = containerRef.current;
            const el = nodeRefs.current[targetNodeId]!;
            if (scroller) {
              safeScrollToCenter(scroller, el);
            } else {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          } else {
            console.warn("⚠️ No ref found for:", targetNodeId || nodeId);
          }
        };


        if (needsViewModeChange) {
          // Set the new view mode
          const newViewMode = targetType === "event" ? "chronology" : "text";
          setViewMode(newViewMode);

          // Wait for the next render cycle to ensure the view has updated
          requestAnimationFrame(() => {
            // Additional small delay to ensure refs are populated
            setTimeout(doScroll, 50);
          });
        } else {
          doScroll();
        }
      }
    }));

    const totalWords = useMemo(
      () =>
        story.chapters.reduce(
          (acc, ch) =>
            acc +
            ch.scenes.reduce(
              (sceneAcc, sc) =>
                sceneAcc +
                sc.nodes
                  .filter((n): n is TextNode => n.type === "text")
                  .reduce(
                    (txtAcc, txt) =>
                      txtAcc +
                      txt.text
                        .replace(/<[^>]+>/g, "")
                        .split(/\s+/)
                        .filter(Boolean).length,
                    0
                  ),
              0
            ),
          0
        ),
      [story]
    );

    const getChapterWordCount = (ch: Chapter) =>
      ch.scenes.reduce(
        (sceneAcc, sc) =>
          sceneAcc +
          sc.nodes
            .filter((n): n is TextNode => n.type === "text")
            .reduce(
              (txtAcc, txt) =>
                txtAcc +
                txt.text
                  .replace(/<[^>]+>/g, "")
                  .split(/\s+/)
                  .filter(Boolean).length,
              0
            ),
        0
      );



    return (
      <div
        ref={containerRef}
        className="text-editor"
        style={editorContainer}
        onMouseLeave={() => {
          setHoveredId(null);
          setHoveredSceneId(null);
          setHoveredChapterId(null);
          setHoveredDetails(null);
        }}
      >
        <SearchBar
          onSearch={(results, reset) => {
            setSearchResults(results);
            setSearchPerformed(!reset);
          }}
        />

        <TextEditorHeader
          totalWords={totalWords}
          viewMode={viewMode}
          onToggleView={() =>
            setViewMode((prev) => (prev === "text" ? "chronology" : "text"))
          }
        />

        <TextEditorContent
          story={story}
          viewMode={viewMode}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          hoveredSceneId={hoveredSceneId}
          setHoveredSceneId={setHoveredSceneId}
          hoveredChapterId={hoveredChapterId}
          setHoveredChapterId={setHoveredChapterId}
          setHoveredDetails={setHoveredDetails}
          focusedNodeId={focusedNodeId || null}
          focusedSceneId={focusedSceneId}
          nodeRefs={nodeRefs}
          onFocusNode={onFocusNode}
          searchResults={searchResults}
          searchPerformed={searchPerformed}
          getChapterWordCount={getChapterWordCount}
        />

        <style>
          {`
            @keyframes fadeSlideUp {
              0% { opacity: 0; transform: translateY(8px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .focused-highlight {
              background-color: rgb(255, 240, 189) !important;
              transition: background-color 0.3s ease;
            }
          `}
        </style>
      </div>
    );
  }
);

export default TextEditor;
