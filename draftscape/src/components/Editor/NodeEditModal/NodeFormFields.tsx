import { EditorContent } from "@tiptap/react";
import NodeToolbar from "./NodeToolbar";

export function NodeFormFields({ node, editor, ...formProps }) {
  const {
    title, setTitle,
    description, setDescription,
    summary, setSummary,
    tags, tagQuery, setTagQuery,
    showTagDropdown, setShowTagDropdown,
    filteredTags, handleAddTag, handleRemoveTag,
    handleTagKeyDown,
    annotationText, setAnnotationText,
    pictureDescription, setPictureDescription,
    handleImageUpload, imagePreview,
    eventYear, setEventYear,
    eventMonth, setEventMonth,
    eventDay, setEventDay

  } = formProps;

  console.log(node.type)

  if (node.type === "chapter" || node.type === "scene") {
    return (
      <>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </>
    );
  }

  if (node.type === "text") {
    return (
      <>
        <label>Summary</label>
        <input value={summary} onChange={(e) => setSummary(e.target.value)} />

        <label>Tags</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "#ccc",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
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
          value={tagQuery}
          onChange={(e) => {
            setTagQuery(e.target.value);
            setShowTagDropdown(true); // ✅ Force dropdown to appear while typing
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
              border: "1px solid #ccc",
              background: "#f5f5f5",
            }}
          >
            {filteredTags.map((tag) => (
              <li
                key={tag}
                onClick={() => handleAddTag(tag)}
                style={{
                  padding: "4px 6px",
                  cursor: "pointer",
                  borderBottom: "1px solid #ddd",
                }}
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <label>Body Text (Rich Text)</label>
        {editor && <NodeToolbar editor={editor} />}
        <EditorContent editor={editor} />
      </>
    );
  }


  if (node.type === "annotation") {
    return (
      <>
        <label>Annotation</label>
        {editor && <NodeToolbar editor={editor} />}
        <EditorContent editor={editor} />
      </>
    );
  }


  if (node.type === "picture") {
    return (
      <>
        <label>Picture Description</label>
        <input value={pictureDescription} onChange={(e) => setPictureDescription(e.target.value)} />
        <label>Upload Image</label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
          </div>
        )}
      </>
    );
  }

  if (node.type === "event") {
    return (
      <>
        <label>Year*</label>
        <input
          type="number"
          value={eventYear}
          onChange={(e) => setEventYear(e.target.value)}
          required
        />

        <label>Month</label>
        <input
          type="number"
          value={eventMonth}
          onChange={(e) => setEventMonth(e.target.value)}
          min={1}
          max={12}
        />

        <label>Day</label>
        <input
          type="number"
          value={eventDay}
          onChange={(e) => setEventDay(e.target.value)}
          min={1}
          max={31}
        />

        <label>Event Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>Tags</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "#ccc",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
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
          value={tagQuery}
          onChange={(e) => {
            setTagQuery(e.target.value);
            setShowTagDropdown(true); // ✅ Force dropdown to appear while typing
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
              border: "1px solid #ccc",
              background: "#f5f5f5",
            }}
          >
            {filteredTags.map((tag) => (
              <li
                key={tag}
                onClick={() => handleAddTag(tag)}
                style={{
                  padding: "4px 6px",
                  cursor: "pointer",
                  borderBottom: "1px solid #ddd",
                }}
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }


  return null;
}
