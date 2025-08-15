// src/components/Editor/TextEditor/TextNodeBlock.tsx
import type { TextNode } from "../../../context/storyStore/types";
import { verticalLineStyle, textContainerStyle, hoverOverlayStyle } from "./textEditorStyles";

type MinimalScene = { id: string; title?: string };

interface TextNodeBlockProps {
  textNode: TextNode;
  scene: MinimalScene;
  chapterId: string;       // <- new
  chapterColor: string;    // <- new, already resolved color string
  onFocusNode: (nodeId: string) => void;

  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  hoveredSceneId: string | null;
  setHoveredSceneId: (id: string | null) => void;
  hoveredChapterId: string | null;
  setHoveredChapterId: (id: string | null) => void;
  setHoveredDetails: (details: any) => void;

  nodeRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  focusedNodeId: string | null;
  focusedSceneId: string | null;

  searchQuery?: string;
}

export default function TextNodeBlock({
  textNode,
  scene,
  chapterId,
  chapterColor,
  onFocusNode,
  hoveredId,
  setHoveredId,
  hoveredSceneId,
  setHoveredSceneId,
  hoveredChapterId,
  setHoveredChapterId,
  setHoveredDetails,
  nodeRefs,
  focusedNodeId,
  focusedSceneId,
  searchQuery = "",
}: TextNodeBlockProps) {
  // word count from plain text
  const plainText = textNode.text.replace(/<[^>]+>/g, "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // hover logic
  const isHoveredText = hoveredId === textNode.id;
  const isHoveredSibling = hoveredSceneId === scene.id && hoveredId !== textNode.id;
  const isChapterHover = hoveredChapterId === chapterId && !isHoveredText;

  // focus logic
  const isFocusedText = focusedNodeId === textNode.id;
  const isSceneFocused = focusedSceneId === scene.id && focusedNodeId?.startsWith("scene-");
  const isFocusedSibling = isSceneFocused && focusedNodeId !== textNode.id;

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const applyHighlightsToHTML = (html: string, query: string) => {
    if (!query.trim()) return html;
    const terms = query.split(/\s+/).filter(Boolean).map(escapeRegExp);
    if (!terms.length) return html;
    const regex = new RegExp(`(${terms.join("|")})`, "gi");
    return html.replace(
      regex,
      (match) =>
        `<span style="background-color: var(--color-warningBg); color: var(--color-text);">${match}</span>`
    );
  };

  return (
    <div
      ref={(el) => {
        nodeRefs.current[textNode.id] = el;
      }}
      className={`text-node ${isFocusedText || isFocusedSibling ? "focused-highlight" : ""}`}
      style={{ marginBottom: "12px", display: "flex", cursor: "pointer" }}
      onClick={() => onFocusNode(textNode.id)}
      onMouseEnter={() => {
        setHoveredId(textNode.id);
        setHoveredSceneId(scene.id);
        setHoveredChapterId(null);
        setHoveredDetails({
          sceneTitle: scene.title,
          textSummary: textNode.summary || "(No summary)",
          tags: textNode.tags || [],
          wordCount,
        });
      }}
      onMouseLeave={() => {
        setHoveredId(null);
        setHoveredSceneId(null);
        setHoveredChapterId(null);
        setHoveredDetails(null);
      }}
    >
      {/* Left vertical line only for hover */}
      <div
        style={verticalLineStyle(
          chapterColor,
          isHoveredText || isHoveredSibling || isChapterHover
        )}
      />

      {/* Node container */}
      <div
        style={{
          ...textContainerStyle(
            chapterColor,
            isHoveredText,
            isHoveredSibling,
            hoveredChapterId === chapterId
          ),
        }}
      >
        {/* Hover overlay */}
        {isHoveredText && (
          <div style={hoverOverlayStyle(chapterColor)}>
            <div><strong>Scene:</strong> {scene.title}</div>
            <div><strong>Summary:</strong> {textNode.summary || "(No summary)"}</div>
            <div><strong>Words:</strong> {wordCount}</div>
            {textNode.tags && textNode.tags.length > 0 && (
              <div style={{ marginTop: "4px" }}>
                <strong>Tags:</strong>{" "}
                {textNode.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "var(--color-panelAlt)",
                      color: "var(--color-text)",
                      padding: "2px 6px",
                      marginRight: "4px",
                      borderRadius: "4px",
                      fontSize: "11px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rich text with highlights */}
        <div
          style={{
            margin: 0,
            fontSize: "14px",
            color: "var(--color-text)",
            lineHeight: "1.4",
          }}
          dangerouslySetInnerHTML={{
            __html: applyHighlightsToHTML(textNode.text || "<em>(Empty Node)</em>", searchQuery),
          }}
        />
      </div>
    </div>
  );
}
