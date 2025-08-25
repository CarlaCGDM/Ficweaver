import { EditorContent, Editor } from "@tiptap/react";
import NodeToolbar from "./NodeToolbar";
import type { NodeData } from "../../../context/storyStore/types";

interface NodeFormFieldsProps {
  node: NodeData;
  editor: Editor | null;
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  summary: string;
  setSummary: (val: string) => void;
  tags: string[];
  tagQuery: string;
  setTagQuery: (val: string) => void;
  showTagDropdown: boolean;
  setShowTagDropdown: (val: boolean) => void;
  filteredTags: string[];
  handleAddTag: (tag: string) => void;
  handleRemoveTag: (tag: string) => void;
  handleTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  annotationText: string;
  setAnnotationText: (val: string) => void;
  pictureDescription: string;
  setPictureDescription: (val: string) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  pictureUrl: string;
  setPictureUrl: (val: string) => void;
  eventYear: string;
  setEventYear: (val: string) => void;
  eventMonth: string;
  setEventMonth: (val: string) => void;
  eventDay: string;
  setEventDay: (val: string) => void;
  eventDescription: string;
  setEventDescription: (val: string) => void;
}

const formGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginBottom: "12px",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 500,
  fontSize: "13px",
  color: "var(--color-text)",
  fontFamily: "var(--font-ui)",
};

const inputStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: "6px",
  border: "1px solid var(--color-border)",
  fontSize: "13px",
  outline: "none",
  transition: "border 0.2s, box-shadow 0.2s",
  fontFamily: "var(--font-ui)",
  background: "var(--color-panel)",
  color: "var(--color-text)",
} as const;

const chipStyle: React.CSSProperties = {
  background: "var(--color-panelAlt)",
  padding: "2px 6px",
  borderRadius: "12px",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: "var(--color-text)",
};

export function NodeFormFields({
  node,
  editor,
  title,
  setTitle,
  description,
  setDescription,
  summary,
  setSummary,
  tags,
  tagQuery,
  setTagQuery,
  showTagDropdown,
  setShowTagDropdown,
  filteredTags,
  handleAddTag,
  handleRemoveTag,
  handleTagKeyDown,
  annotationText: _annotationText,
  setAnnotationText: _setAnnotationText,
  pictureDescription,
  setPictureDescription,
  handleImageUpload,
  imagePreview,
  pictureUrl,
  setPictureUrl,
  eventYear,
  setEventYear,
  eventMonth,
  setEventMonth,
  eventDay,
  setEventDay,
  eventDescription,
  setEventDescription,
}: NodeFormFieldsProps) {
  const renderTagInput = () => (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
        {tags.map((tag: string) => (
          <span key={tag} style={chipStyle}>
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              style={{
                background: "none",
                border: "none",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        style={inputStyle}
        value={tagQuery}
        onChange={(e) => {
          setTagQuery(e.target.value);
          setShowTagDropdown(true);
        }}
        onKeyDown={handleTagKeyDown}
        placeholder="[tag]"
      />
      {showTagDropdown && filteredTags.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            padding: "4px",
            marginTop: "4px",
            border: "1px solid var(--color-border)",
            background: "var(--color-panel)",
            borderRadius: "6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          {filteredTags.map((tag: string) => (
            <li
              key={tag}
              onClick={() => handleAddTag(tag)}
              style={{
                padding: "4px 6px",
                cursor: "pointer",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const renderEditor = () =>
    editor && (
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "6px", padding: "4px" }}>
        <NodeToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    );

  // --- Form layouts per node type ---
  if (node.type === "chapter" || node.type === "scene") {
    return (
      <>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: "80px" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </>
    );
  }

  if (node.type === "text") {
    return (
      <>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Summary</label>
          <input style={inputStyle} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Tags</label>
          {renderTagInput()}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Body Text (Rich Text)</label>
          {renderEditor()}
        </div>
      </>
    );
  }

  if (node.type === "annotation") {
    return (
      <div style={formGroupStyle}>
        <label style={labelStyle}>Annotation</label>
        {renderEditor()}
      </div>
    );
  }

  if (node.type === "picture") {
    return (
      <>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Picture Description</label>
          <input
            style={inputStyle}
            value={pictureDescription}
            onChange={(e) => setPictureDescription(e.target.value)}
          />
        </div>
        <div style={formGroupStyle}>
        <label style={labelStyle}>Image Source URL (optional)</label>
        <input
          type="url"
          style={inputStyle}
          placeholder="https://example.com/original-image"
          value={pictureUrl}
          onChange={(e) => setPictureUrl(e.target.value)}
        />
        {pictureUrl && (
          <a
            href={pictureUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: "12px", marginTop: "4px" }}
          >
            Open source link →
          </a>
        )}
      </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Upload Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
        {imagePreview && (
          <div className="image-preview" style={{ marginTop: "8px" }}>
            <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%" }} />
          </div>
        )}
      </>
    );
  }

  if (node.type === "event") {
    return (
      <>
        {/* Event Title */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Event Title</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {/* Date Row */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
            <label style={labelStyle}>Year*</label>
            <input
              type="number"
              style={{
                padding: "6px 8px",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                fontSize: "14px",
              }}
              value={eventYear}
              onChange={(e) => setEventYear(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
            <label style={labelStyle}>Month</label>
            <input
              type="number"
              style={{
                padding: "6px 8px",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                fontSize: "14px",
              }}
              value={eventMonth}
              onChange={(e) => setEventMonth(e.target.value)}
              min={1}
              max={12}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
            <label style={labelStyle}>Day</label>
            <input
              type="number"
              style={{
                padding: "6px 8px",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                fontSize: "14px",
              }}
              value={eventDay}
              onChange={(e) => setEventDay(e.target.value)}
              min={1}
              max={31}
            />
          </div>
        </div>

        {/* Tags Section */}
        <div style={{ marginBottom: "12px", position: "relative", }}>
          <label style={labelStyle}>
            Tags
          </label>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "4px",
              background: "var(--color-panel)",
              marginTop: "3px"
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                style={chipStyle}
              >
                [{tag}]
                <button
                  onClick={() => handleRemoveTag(tag)}
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
                  ×
                </button>
              </span>
            ))}

            <input
              value={tagQuery}
              onChange={(e) => {
                setTagQuery(e.target.value);
                setShowTagDropdown(true);
              }}
              onKeyDown={handleTagKeyDown}
              placeholder="[tag]"
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontSize: "14px",
                background: "transparent",
                minWidth: "80px",
              }}
            />
          </div>

          {/* Floating Dropdown */}
          {showTagDropdown && filteredTags.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: "0",
                background: "var(--color-panel)",
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
                    handleAddTag(tag);
                  }}
                  style={{
                    padding: "6px 8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f9f9f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Event Description */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Event Description</label>
          {renderEditor()}
        </div>

      </>
    );
  }


  return null;
}
