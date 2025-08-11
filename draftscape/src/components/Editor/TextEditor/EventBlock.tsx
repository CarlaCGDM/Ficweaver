import type { EventNode } from "../../../context/storyStore/types";

interface EventBlockProps {
    event: EventNode;
    onFocusNode: (nodeId: string) => void;
    isFocused: boolean;
    isHovered: boolean;
    setHoveredId: (id: string | null) => void;
    setHoveredDetails: (details: any) => void;
    nodeRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    searchQuery?: string;
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

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const applyHighlights = (text: string, query?: string) => {
        if (!query?.trim()) return text;
        const terms = query.split(/\s+/).filter(Boolean);
        if (terms.length === 0) return text;
        const regex = new RegExp(`(${terms.map((t) => escapeRegExp(t)).join("|")})`, "gi");
        return text.replace(
            regex,
            (m) =>
                `<span style="background-color: var(--color-warningBg); color: var(--color-text);">${m}</span>`
        );
    };

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
                background: isHovered ? "var(--color-panelAlt)" : "transparent",
            }}
            onClick={() => onFocusNode(event.id)}
            onMouseEnter={() => {
                setHoveredId(event.id);
                setHoveredDetails({
                    textSummary: event.title || "(Untitled)",
                    tags: event.tags || [],
                    description: event.description || "",
                });
            }}
            onMouseLeave={() => {
                setHoveredId(null);
                setHoveredDetails(null);
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                }}
            >
                <div style={{ color: "var(--color-mutedText)", whiteSpace: "nowrap" }}>
                    {timestamp || "Unknown date"}
                </div>
                <span style={{ margin: "0 4px", color: "var(--color-mutedText)" }}>—</span>
                <div
                    style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--color-text)",
                    }}
                    dangerouslySetInnerHTML={{
                        __html: applyHighlights(event.title || "(Untitled Event)", searchQuery),
                    }}
                />
            </div>

            {isHovered && (
                <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--color-mutedText)" }}>
                    {event.description && (
                        <div
                            style={{
                                marginBottom: "2px",
                                fontStyle: "italic",
                                overflow: "hidden",
                            }}
                            dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                    )}
                    {event.tags?.length > 0 && (
                        <div>
                            Tags:{" "}
                            {event.tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        background: "var(--color-panel)",
                                        color: "var(--color-text)",
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
