// src/components/Editor/TextEditor/SearchBar.tsx
import React, { useState, useMemo, useRef } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import type { Story, NodeData, TextNode, EventNode } from "../../../context/storyStore/types";
import { Search, X, ChevronDown } from "lucide-react";

interface SearchBarProps {
  onSearch: (results: {
    chapters: string[];
    textNodes: string[];
    eventNodes: string[];
    searchQuery?: string;
  }, reset?: boolean) => void;
}

// --- helpers (flat structure) ---
const lc = (s: string | undefined | null) => (s ?? "").toLowerCase();

function chapterAncestorId(story: Story, nodeId: string): string | null {
  let cur: string | null = nodeId;
  while (cur) {
    const n: NodeData | undefined = story.nodeMap[cur];
    if (!n) return null;
    if (n.type === "chapter") return n.id;
    cur = n.parentId;
  }
  return null;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const story = useStoryStore((state) => state.story);

  // All tags from text + event nodes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const n of Object.values(story.nodeMap)) {
      if ((n.type === "text" || n.type === "event") && (n as any).tags) {
        (n as any).tags!.forEach((t: string) => tags.add(t));
      }
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [story.nodeMap]);

  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [mode, setMode] = useState<"all" | "any">("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = useMemo(() => {
    if (!query.startsWith("[")) return [];
    const q = lc(query.slice(1));
    return allTags.filter((t) => lc(t).startsWith(q) && !chips.includes(t));
  }, [query, allTags, chips]);

  const handleAddChip = (tag: string) => {
    setChips((prev) => [...prev, tag]);
    setQuery("");
    setShowDropdown(false);
  };

  const handleRemoveChip = (tag: string) => {
    const newChips = chips.filter((c) => c !== tag);
    setChips(newChips);
    if (newChips.length === 0 && query.trim() === "") {
      onSearch({ chapters: [], textNodes: [], eventNodes: [], searchQuery: "" }, true);
    }
  };

  const handleSearch = () => {
    const textTerm = lc(query.trim());

    const results = {
      chapters: [] as string[],
      textNodes: [] as string[],
      eventNodes: [] as string[],
      searchQuery: textTerm,
    };

    const chapterSet = new Set<string>();

    const matchesTags = (node: NodeData) => {
      const nodeTags = (node as any).tags as string[] | undefined;
      if (!chips.length) return true; // no tag filter
      if (!nodeTags || nodeTags.length === 0) return false;
      if (mode === "all") return chips.every((t) => nodeTags.includes(t));
      return chips.some((t) => nodeTags.includes(t));
    };

    const matchesText = (node: NodeData) => {
      if (!textTerm) return true; // no text filter
      if (node.type === "text") {
        const txt = lc((node as TextNode).text);
        const sum = lc((node as TextNode).summary);
        return txt.includes(textTerm) || sum.includes(textTerm);
      }
      if (node.type === "event") {
        const title = lc((node as EventNode).title);
        const tagHit = ((node as EventNode).tags || []).some((t) => lc(t).includes(textTerm));
        return title.includes(textTerm) || tagHit;
      }
      return false;
    };

    for (const n of Object.values(story.nodeMap)) {
      if (n.type !== "text" && n.type !== "event") continue;

      const tagOk = matchesTags(n);
      const textOk = matchesText(n);

      // "all" = both filters must pass; "any" = either filter can pass
      const passes =
        mode === "all"
          ? tagOk && textOk
          : (chips.length ? tagOk : false) || (textTerm ? textOk : false);

      if (!passes) continue;

      // collect node id
      if (n.type === "text") results.textNodes.push(n.id);
      if (n.type === "event") results.eventNodes.push(n.id);

      // find its chapter ancestor to mark the chapter hit
      const chId = chapterAncestorId(story, n.id);
      if (chId) chapterSet.add(chId);
    }

    results.chapters = Array.from(chapterSet);
    onSearch(results);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(val.startsWith("["));
    if (val.trim() === "" && chips.length === 0) {
      onSearch({ chapters: [], textNodes: [], eventNodes: [], searchQuery: "" }, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showDropdown && filteredTags.length > 0) {
        handleAddChip(filteredTags[0]);
      } else if (query.startsWith("[") && query.endsWith("]")) {
        const tag = query.slice(1, -1);
        if (allTags.includes(tag)) handleAddChip(tag);
      } else {
        handleSearch();
      }
    }
  };

  const clearSearch = () => {
    setQuery("");
    setChips([]);
    onSearch({ chapters: [], textNodes: [], eventNodes: [], searchQuery: "" }, true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px", position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid var(--color-border)",
          padding: "4px 6px",
          borderRadius: "6px",
          background: "var(--color-bg)",
          height: "30px",
          color: "var(--color-text)",
          fontFamily: "var(--font-ui)",
        }}
      >
        {chips.map((chip) => (
          <span
            key={chip}
            style={{
              background: "var(--color-tagBg)",
              padding: "2px 6px",
              marginRight: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              fontSize: "13px",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
            }}
          >
            [{chip}]
            <button
              onClick={() => handleRemoveChip(chip)}
              style={{
                marginLeft: "4px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: 0,
                color: "var(--color-mutedText)",
              }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search text or [tag]"
          style={{
            border: "none",
            outline: "none",
            flex: 1,
            fontSize: "14px",
            marginLeft: "4px",
            background: "transparent",
            color: "var(--color-text)",
            fontFamily: "var(--font-ui)",
          }}
        />

        {/* Mode toggle */}
        <button
          onClick={() => setMode(mode === "all" ? "any" : "all")}
          style={{
            marginLeft: "6px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            border: "none",
            background: "transparent",
            color: "var(--color-mutedText)",
            fontFamily: "var(--font-ui)",
          }}
        >
          {mode === "all" ? "All" : "Any"}
          <ChevronDown size={14} style={{ marginLeft: "2px" }} />
        </button>

        {/* Search */}
        <button
          onClick={handleSearch}
          style={{
            marginLeft: "6px",
            cursor: "pointer",
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            color: "var(--color-mutedText)",
          }}
        >
          <Search size={16} strokeWidth={2} />
        </button>

        {/* Clear */}
        {(query || chips.length > 0) && (
          <button
            onClick={clearSearch}
            style={{
              marginLeft: "6px",
              cursor: "pointer",
              border: "none",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              color: "var(--color-mutedText)",
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Tag Dropdown */}
      {showDropdown && filteredTags.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "42px",
            left: "0",
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            boxShadow: "var(--node-shadow)",
            zIndex: 10,
            width: "200px",
            maxHeight: "150px",
            overflowY: "auto",
            color: "var(--color-text)",
            fontFamily: "var(--font-ui)",
          }}
        >
          {filteredTags.map((tag) => (
            <div
              key={tag}
              onClick={() => {
                handleAddChip(tag);
                inputRef.current?.focus();
              }}
              style={{
                padding: "6px 8px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-panelAlt)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
