import { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import type { Chapter, TextNode } from "../../../context/storyStore/types";
import { editorContainer } from "./textEditorStyles";
import ChapterBlock from "./ChapterBlock";
import TextEditorHeader from "./TextEditorHeader";
import SearchBar from "./SearchBar";

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

    // ✅ Hover states
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
    const [hoveredChapterId, setHoveredChapterId] = useState<string | null>(null);
    const [hoveredDetails, setHoveredDetails] = useState<{
      sceneTitle?: string;
      textSummary?: string;
      tags?: string[];
      wordCount?: number;
    } | null>(null);

    // ✅ Scene focus tracking (only needed for chapter-level highlights)
    const [focusedSceneId, setFocusedSceneId] = useState<string | null>(null);

    // ✅ When focus clears (e.g. X key pressed), reset immediately
    useEffect(() => {
      if (!focusedNodeId) {
        console.log("🔄 TextEditor: Clearing focus immediately");
        setFocusedSceneId(null);
      }
    }, [focusedNodeId]);

    // ✅ Search state
    const [searchResults, setSearchResults] = useState<{
      chapters: string[];
      textNodes: string[];
      searchQuery?: string;
    }>({ chapters: [], textNodes: [], searchQuery: "" });
    const [searchPerformed, setSearchPerformed] = useState(false);

    // ✅ Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // ✅ Scroll to node and update scene context
    useImperativeHandle(ref, () => ({
      scrollToNode(nodeId: string) {
        console.log("🔍 scrollToNode called with:", nodeId);

        let targetNodeId: string | null = null;

        // TEXT NODE
        const textNode = story.chapters
          .flatMap((ch) => ch.scenes.flatMap((sc) => sc.nodes))
          .find((n) => n.id === nodeId && n.type === "text");
        if (textNode) {
          targetNodeId = textNode.id;
          const parentScene = story.chapters
            .flatMap((ch) => ch.scenes)
            .find((sc) => sc.nodes.some((n) => n.id === textNode.id));
          setFocusedSceneId(parentScene?.id || null);
        }

        // CHAPTER NODE
        if (!targetNodeId) {
          const chapter = story.chapters.find(
            (ch) => ch.chapterNode.id === nodeId || ch.id === nodeId
          );
          if (chapter) {
            targetNodeId = chapter.chapterNode.id;
            setFocusedSceneId(null); // No scene context for chapter
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
            setFocusedSceneId(scene.id);
          }
        }

        // Scroll behavior
        if (targetNodeId && nodeRefs.current[targetNodeId]) {
          const mainLayout = containerRef.current?.closest(".main-layout");
          const initialScrollTop = mainLayout?.scrollTop || 0;
          nodeRefs.current[targetNodeId]?.scrollIntoView({ behavior: "smooth", block: "center" });
          if (mainLayout) mainLayout.scrollTop = initialScrollTop; // Prevent layout shift
        } else {
          console.warn("⚠️ No ref found for:", targetNodeId || nodeId);
        }
      },
    }));

    // ✅ Word count calculation
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
                      txtAcc + txt.text.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length,
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
                txtAcc + txt.text.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length,
              0
            ),
        0
      );

    // ✅ Search filtering
    const hasActiveSearch = searchPerformed;
    const filteredChapters = hasActiveSearch
      ? story.chapters.filter((ch) => searchResults.chapters.includes(ch.id))
      : story.chapters;

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
        {/* 🔍 Search bar */}
        <SearchBar
          onSearch={(results, reset) => {
            setSearchResults(results);
            setSearchPerformed(!reset);
          }}
        />

        {/* 📊 Header */}
        <TextEditorHeader totalWords={totalWords} />

        {/* Chapters */}
        {hasActiveSearch && filteredChapters.length === 0 ? (
          <div style={{ padding: "20px", color: "#666", fontStyle: "italic", textAlign: "center" }}>
            No results found. Try adjusting your search or clearing filters.
          </div>
        ) : (
          filteredChapters.map((ch) => (
            <ChapterBlock
              key={ch.id}
              chapter={ch}
              index={story.chapters.findIndex((c) => c.id === ch.id)}
              onFocusNode={onFocusNode}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              hoveredSceneId={hoveredSceneId}
              setHoveredSceneId={setHoveredSceneId}
              hoveredChapterId={hoveredChapterId}
              setHoveredChapterId={setHoveredChapterId}
              setHoveredDetails={setHoveredDetails}
              getChapterWordCount={getChapterWordCount}
              nodeRefs={nodeRefs}
              focusedNodeId={focusedNodeId || null}  // ✅ Use global directly
              focusedSceneId={focusedSceneId}       // ✅ Scene context for highlighting
              searchResults={searchResults}
              searchQuery={searchResults.searchQuery || ""}
            />
          ))
        )}

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
