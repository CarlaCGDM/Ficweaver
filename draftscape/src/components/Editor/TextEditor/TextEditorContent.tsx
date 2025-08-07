import ChapterBlock from "./ChapterBlock";
import type { Chapter, EventNode } from "../../../context/storyStore/types";
import EventBlock from "./EventBlock";

interface Props {
  story: { chapters: Chapter[] };
  viewMode: "text" | "chronology";
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  hoveredSceneId: string | null;
  setHoveredSceneId: (id: string | null) => void;
  hoveredChapterId: string | null;
  setHoveredChapterId: (id: string | null) => void;
  setHoveredDetails: (details: any) => void;
  focusedNodeId: string | null;
  focusedSceneId: string | null;
  nodeRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
  onFocusNode: (nodeId: string) => void;
  // ⬇️ include eventNodes + searchQuery
  searchResults: { chapters: string[]; textNodes: string[]; eventNodes?: string[]; searchQuery?: string };
  searchPerformed: boolean;
  getChapterWordCount: (ch: Chapter) => number;
}

export default function TextEditorContent({
  story,
  viewMode,
  hoveredId,
  setHoveredId,
  hoveredSceneId,
  setHoveredSceneId,
  hoveredChapterId,
  setHoveredChapterId,
  setHoveredDetails,
  focusedNodeId,
  focusedSceneId,
  nodeRefs,
  onFocusNode,
  searchResults,
  searchPerformed,
  getChapterWordCount,
}: Props) {
  if (viewMode === "text") {
    const filteredChapters = searchPerformed
      ? story.chapters.filter((ch) => searchResults.chapters.includes(ch.id))
      : story.chapters;

    if (searchPerformed && filteredChapters.length === 0) {
      return (
        <div style={{ padding: "20px", color: "#666", fontStyle: "italic", textAlign: "center" }}>
          No results found. Try adjusting your search or clearing filters.
        </div>
      );
    }

    return (
      <>
        {filteredChapters.map((ch, idx) => (
          <ChapterBlock
            key={ch.id}
            chapter={ch}
            index={idx}
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
            focusedNodeId={focusedNodeId}
            focusedSceneId={focusedSceneId}
            searchResults={searchResults}
            searchQuery={searchResults.searchQuery || ""}
          />
        ))}
      </>
    );
  }

  // =========================
  // Chronology (Events) View
  // =========================
  if (viewMode === "chronology") {
    const allEventNodes: EventNode[] = story.chapters.flatMap((ch) =>
      ch.scenes.flatMap((sc) => sc.nodes.filter((n): n is EventNode => n.type === "event"))
    );

    // If search was performed, prefer explicit event ID results;
    // otherwise fall back to simple query match (title/tags).
    const filteredEvents: EventNode[] = (() => {
      if (!searchPerformed) return allEventNodes;

      if (searchResults.eventNodes && searchResults.eventNodes.length > 0) {
        const set = new Set(searchResults.eventNodes);
        return allEventNodes.filter((ev) => set.has(ev.id));
      }

      const q = (searchResults.searchQuery || "").trim().toLowerCase();
      if (!q) return allEventNodes;

      return allEventNodes.filter((ev) => {
        const titleMatch = (ev.title || "").toLowerCase().includes(q);
        const tagMatch = ev.tags?.some((t) => t.toLowerCase().includes(q));
        return titleMatch || tagMatch;
      });
    })();

    if (searchPerformed && filteredEvents.length === 0) {
      return (
        <div style={{ padding: "20px", color: "#666", fontStyle: "italic", textAlign: "center" }}>
          No events match your search.
        </div>
      );
    }

    const sortedEvents = filteredEvents.sort((a, b) => {
      const dateA = new Date(a.year, a.month ?? 0, a.day ?? 1);
      const dateB = new Date(b.year, b.month ?? 0, b.day ?? 1);
      return dateA.getTime() - dateB.getTime();
    });

    // Group by year
    const groupedByYear: Record<number, EventNode[]> = {};
    for (const event of sortedEvents) {
      if (!groupedByYear[event.year]) groupedByYear[event.year] = [];
      groupedByYear[event.year].push(event);
    }

    const sortedYears = Object.keys(groupedByYear)
      .map(Number)
      .sort((a, b) => a - b);

    return (
      <div style={{ padding: "0 12px", marginTop: "12px" }}>
        {sortedYears.map((year) => (
          <div key={year}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "24px 0 8px 0",
                color: "#555",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc", marginRight: "8px" }} />
              <span>Year {year}</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc", marginLeft: "8px" }} />
            </div>

            {groupedByYear[year].map((event) => (
              <EventBlock
                key={event.id}
                event={event}
                onFocusNode={onFocusNode}
                isFocused={focusedNodeId === event.id}
                isHovered={hoveredId === event.id}
                setHoveredId={setHoveredId}
                setHoveredDetails={setHoveredDetails}
                nodeRefs={nodeRefs}
                // ⬇️ used for highlight inside EventBlock
                searchQuery={searchResults.searchQuery || ""}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }
}
