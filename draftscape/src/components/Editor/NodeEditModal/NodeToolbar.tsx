import { Bold, Italic, List, Quote, Eraser, Link as LinkIcon, Link2Off } from "lucide-react";

export default function NodeToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "");
    if (url === null) return; // Cancel
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="modal-toolbar">
      <button onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={14} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={14} />
      </button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={14} />
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={14} />
      </button>

      {/* 🔗 Add/Edit Link */}
      <button onClick={setLink}>
        <LinkIcon size={14} />
      </button>

      {/* 🚫 Remove Link */}
      <button onClick={unsetLink}>
        <Link2Off size={14} />
      </button>

      <button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        <Eraser size={14} />
      </button>
    </div>
  );
}
