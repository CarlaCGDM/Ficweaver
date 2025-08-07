import type { TextNode, Scene, Chapter } from "../../../context/storyStore/types";
import { verticalLineStyle, textContainerStyle, hoverOverlayStyle } from "./textEditorStyles";

interface TextNodeBlockProps {
  textNode: TextNode;
  scene: Scene;
  chapter: Chapter;
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
  chapter,
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
  // ✅ Word count from plain text
  const plainText = textNode.text.replace(/<[^>]+>/g, "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // ✅ Hover logic
  const isHoveredText = hoveredId === textNode.id;
  const isHoveredSibling = hoveredSceneId === scene.id && hoveredId !== textNode.id;
  const isChapterHover = hoveredChapterId === chapter.id && !isHoveredText;

  // ✅ Focus logic
  const isFocusedText = focusedNodeId === textNode.id;
  const isSceneFocused = focusedSceneId === scene.id && focusedNodeId?.startsWith("scene-");
  const isFocusedSibling = isSceneFocused && focusedNodeId !== textNode.id;

  // ✅ Apply highlights directly to HTML
  const applyHighlightsToHTML = (html: string, query: string) => {
    if (!query.trim()) return html;
    const terms = query.split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${terms.join("|")})`, "gi");
    return html.replace(regex, (match) => `<span style="background-color: yellow;">${match}</span>`);
  };

  return (
    <div
      ref={(el) => { nodeRefs.current[textNode.id] = el; }}
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
      {/* ✅ Left vertical line only for hover */}
      <div
        style={verticalLineStyle(
          chapter.color,
          isHoveredText || isHoveredSibling || isChapterHover
        )}
      />

      {/* ✅ Node container */}
      <div
        style={{
          ...textContainerStyle(
            chapter.color,
            isHoveredText,
            isHoveredSibling,
            hoveredChapterId === chapter.id
          ),
        }}
      >
        {/* ✅ Hover overlay */}
        {isHoveredText && (
          <div style={hoverOverlayStyle(chapter.color)}>
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
                      background: "#eee",
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

        {/* ✅ Render Rich Text Content with Highlighting */}
        <div
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#333",
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
