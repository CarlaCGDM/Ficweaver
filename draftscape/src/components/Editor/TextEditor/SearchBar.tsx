import React, { useState, useMemo, useRef } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { Search, X, ChevronDown } from "lucide-react"; // ✅ Lucide icons

interface SearchBarProps {
  onSearch: (results: { chapters: string[]; textNodes: string[]; eventNodes: string[]; searchQuery?: string }, reset?: boolean) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const story = useStoryStore((state) => state.story);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    story.chapters.forEach((ch) =>
      ch.scenes.forEach((sc) =>
        sc.nodes.forEach((n) => {
          if ((n.type === "text" || n.type === "event") && n.tags) {
            n.tags.forEach((t) => tags.add(t));
          }
        })
      )
    );
    return Array.from(tags);
  }, [story]);

  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [mode, setMode] = useState<"all" | "any">("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);


  const filteredTags = useMemo(() => {
    if (!query.startsWith("[")) return [];
    const q = query.slice(1).toLowerCase();
    return allTags.filter((t) => t.toLowerCase().startsWith(q) && !chips.includes(t));
  }, [query, allTags, chips]);

  const handleAddChip = (tag: string) => {
    setChips([...chips, tag]);
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
    const textTerm = query.trim().toLowerCase();

    const results: { chapters: string[]; textNodes: string[]; eventNodes: string[]; searchQuery?: string } = {
      chapters: [],
      textNodes: [],
      eventNodes: [],
      searchQuery: textTerm
    };

    story.chapters.forEach((ch) => {
      let chapterHasMatch = false;
      ch.scenes.forEach((sc) => {
        sc.nodes.forEach((n) => {
          const matchesTagAll = chips.every((chip) => n.tags?.includes(chip));
          const matchesTagAny = chips.some((chip) => n.tags?.includes(chip));

          const matchesText =
            !textTerm ||
            (n.type === "text" && (n.text.toLowerCase().includes(textTerm) || n.summary?.toLowerCase().includes(textTerm))) ||
            (n.type === "event" && (n.title?.toLowerCase().includes(textTerm) || n.tags?.some(t => t.toLowerCase().includes(textTerm))));

          const matchLogic =
            mode === "all"
              ? (!chips.length || matchesTagAll) && (!textTerm || matchesText)
              : (chips.length && matchesTagAny) || (textTerm && matchesText);

          if (matchLogic) {
            if (n.type === "text") results.textNodes.push(n.id);
            if (n.type === "event") results.eventNodes.push(n.id);
            chapterHasMatch = true;
          }
        });
      });
      if (chapterHasMatch) results.chapters.push(ch.id);
    });


    onSearch(results);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(val.startsWith("["));
    if (val.trim() === "" && chips.length === 0) {
      onSearch({ chapters: [], textNodes: [], searchQuery: "" }, true);
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
    onSearch({ chapters: [], textNodes: [], searchQuery: "" }, true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px", position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #ccc",
          padding: "4px 6px",
          borderRadius: "6px",
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          height: "30px",
        }}
      >
        {chips.map((chip) => (
          <span
            key={chip}
            style={{
              background: "#f2f2f2",
              padding: "2px 6px",
              marginRight: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              fontSize: "13px",
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
            color: "#555",
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
            color: "#555",
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
              color: "#999",
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
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 10,
            width: "200px",
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          {filteredTags.map((tag) => (
            <div
              key={tag}
              onClick={() => {
                handleAddChip(tag);
                inputRef.current?.focus(); // ✅ Refocus input so Enter will work next
              }}

              style={{
                padding: "6px 8px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
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
