import type { EventNode } from "../../../context/storyStore/types";
import { hoverSummaryStyle } from "./textEditorStyles";

interface EventBlockProps {
  event: EventNode;
  onFocusNode: (nodeId: string) => void;
  isFocused: boolean;
  isHovered: boolean;
  setHoveredId: (id: string | null) => void;
  setHoveredDetails: (details: any) => void;
  nodeRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  searchQuery?: string; // already present
}

export default function EventBlock({
  event,
  onFocusNode,
  isFocused,
  isHovered,
  setHoveredId,
  setHoveredDetails,
  nodeRefs,
  searchQuery,
}: EventBlockProps) {
  const timestamp = [
    event.year,
    event.month?.toString().padStart(2, "0"),
    event.day?.toString().padStart(2, "0"),
  ]
    .filter(Boolean)
    .join(" / ");

  const applyHighlights = (text: string, query?: string) => {
    if (!query?.trim()) return text;
    const terms = query.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return text;
    const regex = new RegExp(`(${terms.map((t) => escapeRegExp(t)).join("|")})`, "gi");
    return text.replace(regex, (m) => `<span style="background-color: yellow;">${m}</span>`);
  };

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return (
    <div
      ref={(el) => {
        nodeRefs.current[event.id] = el;
      }}
      className={isFocused ? "focused-highlight" : ""}
      style={{
        padding: "4px 6px",
        marginBottom: "6px",
        cursor: "pointer",
        borderRadius: "4px",
        transition: "background 0.2s ease",
        background: isHovered ? "#f6f6f6" : "transparent",
      }}
      onClick={() => onFocusNode(event.id)}
      onMouseEnter={() => {
        setHoveredId(event.id);
        setHoveredDetails({
          textSummary: event.title || "(Untitled)",
          tags: event.tags || [],
          description: "(Description coming soon…)",
        });
      }}
      onMouseLeave={() => {
        setHoveredId(null);
        setHoveredDetails(null);
      }}
    >
      <div style={{ fontSize: "12px", color: "#666" }}>{timestamp || "Unknown date"}</div>
      <div
        style={{ fontWeight: "500", fontSize: "13px" }}
        dangerouslySetInnerHTML={{
          __html: applyHighlights(event.title || "(Untitled Event)", searchQuery),
        }}
      />

      {/* Only show extra details on hover */}
      {isHovered && (
        <div style={{ marginTop: "4px", fontSize: "11px", color: "#666" }}>
          <div style={{ marginBottom: "2px", fontStyle: "italic" }}>
            (Description coming soon…)
          </div>
          {event.tags?.length > 0 && (
            <div>
              Tags:{" "}
              {event.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "#eee",
                    padding: "2px 6px",
                    marginRight: "4px",
                    borderRadius: "4px",
                    fontSize: "10px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
