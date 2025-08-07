// NodeEditModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useStoryStore } from "../../../context/storyStore/storyStore";
import { useImageStore } from "../../../context/imageStore/imageStore";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Save, X } from "lucide-react";
import "./nodeEditModalStyles.css";
import { NodeFormFields } from "./NodeFormFields";
import type { NodeData } from "../../../context/storyStore/types";

interface NodeEditModalProps {
  node: NodeData | null;
  onClose: () => void;
}

export default function NodeEditModal({ node, onClose }: NodeEditModalProps) {
  const updateNodeData = useStoryStore((s) => s.updateNodeData);
  const story = useStoryStore((s) => s.story);
  const { imageMap, setImage } = useImageStore();

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    story.chapters.forEach((ch) =>
      ch.scenes.forEach((sc) =>
        sc.nodes.forEach((n) => {
          if ((n.type === "text" || n.type === "event") && n.tags) n.tags.forEach((t) => tags.add(t));
        })
      )
    );
    return Array.from(tags);
  }, [story]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [annotationText, setAnnotationText] = useState("");
  const [pictureDescription, setPictureDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [eventYear, setEventYear] = useState("");
  const [eventMonth, setEventMonth] = useState("");
  const [eventDay, setEventDay] = useState("");

  const textEditor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: { attributes: { class: "rich-editor", spellCheck: "true" } },
  });

  useEffect(() => {
    if (!node) return;

    if (node.type === "chapter" || node.type === "scene") {
      setTitle(node.title);
      setDescription(node.description || "");
    } else if (node.type === "text") {
      setSummary(node.summary || "");
      if (textEditor) textEditor.commands.setContent(node.text || "");
      setTags(node.tags || []);
    } else if (node.type === "annotation") {
      if (textEditor) textEditor.commands.setContent(node.text || "");
    } else if (node.type === "picture") {
      setPictureDescription(node.description || "");
      const storedImage = imageMap[node.id];
      setImagePreview(storedImage || null);
    } else if (node.type === "event") {
      setEventYear(node.year.toString());
      setEventMonth(node.month?.toString() ?? "");
      setEventDay(node.day?.toString() ?? "");
      setTitle(node.title || "");
      setTags(node.tags || []);
    }

  }, [node, textEditor, imageMap]);

  if (!node) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !node) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(node.id, file);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (node.type === "chapter" || node.type === "scene") {
      updateNodeData(node.id, { title, description });
    } else if (node.type === "text") {
      updateNodeData(node.id, {
        summary,
        text: textEditor ? textEditor.getHTML() : "",
        tags,
      });
    } else if (node.type === "annotation") {
      updateNodeData(node.id, {
        text: textEditor ? textEditor.getHTML() : "",
      });
    } else if (node.type === "picture") {
      updateNodeData(node.id, { description: pictureDescription });
    } else if (node.type === "event") {
      updateNodeData(node.id, {
        year: parseInt(eventYear),
        month: eventMonth ? parseInt(eventMonth) : undefined,
        day: eventDay ? parseInt(eventDay) : undefined,
        title,
        tags,
      });
    }

    onClose();
  };

  const filteredTags = useMemo(() => {
    if (!tagQuery.startsWith("[")) return [];
    const q = tagQuery.slice(1).toLowerCase();
    return allTags.filter((t) => t.toLowerCase().startsWith(q) && !tags.includes(t));
  }, [tagQuery, allTags, tags]);

  const handleAddTag = (tag: string) => {
    setTags([...tags, tag]);
    setTagQuery("");
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showTagDropdown && filteredTags.length > 0) {
        handleAddTag(filteredTags[0]);
      } else if (tagQuery.startsWith("[") && tagQuery.endsWith("]")) {
        const tag = tagQuery.slice(1, -1).trim();
        if (tag && !tags.includes(tag)) {
          handleAddTag(tag);
        }
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit {node.type}</h2>
        <div className="modal-form">
          <NodeFormFields
            node={node}
            editor={textEditor}
            title={title} setTitle={setTitle}
            description={description} setDescription={setDescription}
            summary={summary} setSummary={setSummary}
            tags={tags} tagQuery={tagQuery} setTagQuery={setTagQuery}
            showTagDropdown={showTagDropdown} setShowTagDropdown={setShowTagDropdown}
            filteredTags={filteredTags}
            handleAddTag={handleAddTag} handleRemoveTag={handleRemoveTag} handleTagKeyDown={handleTagKeyDown}
            annotationText={annotationText} setAnnotationText={setAnnotationText}
            pictureDescription={pictureDescription} setPictureDescription={setPictureDescription}
            handleImageUpload={handleImageUpload} imagePreview={imagePreview}
            eventYear={eventYear} setEventYear={setEventYear}
            eventMonth={eventMonth} setEventMonth={setEventMonth}
            eventDay={eventDay} setEventDay={setEventDay}

          />
        </div>

        <div className="modal-footer">
          <button onClick={handleSave} className="btn btn-primary">
            <Save size={16} /> Save
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            <X size={16} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
