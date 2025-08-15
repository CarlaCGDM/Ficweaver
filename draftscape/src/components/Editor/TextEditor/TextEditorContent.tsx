// src/components/Editor/TextEditor/TextEditorContent.tsx
import ChapterBlock, { type ChapterLike } from "./ChapterBlock";
import EventBlock from "./EventBlock";
import type {
  Story,
  ChapterNode,
  SceneNode,
  NodeData,
  EventNode,
} from "../../../context/storyStore/types";

interface Props {
  story: Story; // ⬅️ flat model
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
  searchResults: {
    chapters: string[];
    textNodes: string[];
    eventNodes?: string[];
    searchQuery?: string;
  };
  searchPerformed: boolean;
  // Accepts either a chapter-like object or a chapter id
  getChapterWordCount: (ch: any) => number;
}

/** Build a temporary "Chapter-like" shape for ChapterBlock (to avoid rewriting it right now) */
function buildChapterLike(
  story: Story,
  chapterId: string
): ChapterLike | null {
  const ch = story.nodeMap[chapterId] as ChapterNode | undefined;
  if (!ch || ch.type !== "chapter") return null;

  const sceneIds = story.childrenOrder[chapterId] ?? [];
  const scenes = sceneIds
    .map((scId) => {
      const sc = story.nodeMap[scId] as SceneNode | undefined;
      if (!sc || sc.type !== "scene") return null;
      const childIds = story.childrenOrder[scId] ?? [];
      const nodes = childIds
        .map((cid) => story.nodeMap[cid])
        .filter(Boolean) as NodeData[];
      return {
        id: sc.id,
        title: sc.title,
        description: sc.description,
        nodes,
      };
    })
    .filter(Boolean) as ChapterLike["scenes"];

  return { id: ch.id, chapterNode: ch, scenes };
}

function isChapterLike(x: ReturnType<typeof buildChapterLike>): x is ChapterLike {
  return x !== null;
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
    // Build all chapters in outline order
    const allChapters: ChapterLike[] = story.order
      .map((chId) => buildChapterLike(story, chId))
      .filter(isChapterLike);

    // Apply search filter (by chapter id) if needed
    const filteredChapters: ChapterLike[] = searchPerformed
      ? allChapters.filter((ch) => searchResults.chapters.includes(ch.id))
      : allChapters;

    if (searchPerformed && filteredChapters.length === 0) {
      return (
        <div
          style={{
            padding: "20px",
            color: "#666",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          No results found. Try adjusting your search or clearing filters.
        </div>
      );
    }

    return (
      <>
        {searchPerformed && (
          <div
            style={{
              margin: "8px 12px 12px",
              color: "var(--color-mutedText)",
              fontSize: "12px",
              fontFamily: "var(--font-ui)",
            }}
          >
            {`Found ${(searchResults.textNodes?.length ?? 0)} node${(searchResults.textNodes?.length ?? 0) === 1 ? "" : "s"}.`}
          </div>
        )}

        {filteredChapters.map((ch, idx) => (
          <ChapterBlock
            key={ch.id}
            chapter={ch as any}
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
    // Pull all events from flat map
    const allEventNodes: EventNode[] = Object.values(story.nodeMap).filter(
      (n): n is EventNode => n.type === "event"
    );

    // If search performed, prefer explicit event ID results; else query match
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
        <div
          style={{
            padding: "20px",
            color: "#666",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
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
        {
          searchPerformed && (
            <div
              style={{
                margin: "8px 12px 12px",
                color: "var(--color-mutedText)",
                fontSize: "12px",
                fontFamily: "var(--font-ui)",
              }}
            >
              {`Found ${filteredEvents.length} event${filteredEvents.length === 1 ? "" : "s"}.`}
            </div>
          )
        }
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
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "#ccc",
                  marginRight: "8px",
                }}
              />
              <span>Year {year}</span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "#ccc",
                  marginLeft: "8px",
                }}
              />
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
                // used for highlight inside EventBlock
                searchQuery={searchResults.searchQuery || ""}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
