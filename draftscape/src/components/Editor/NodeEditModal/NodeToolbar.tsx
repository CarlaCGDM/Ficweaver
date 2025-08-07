import { Bold, Italic, List, Quote, Eraser } from "lucide-react";

export default function NodeToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  return (
    <div className="modal-toolbar">
      <button onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></button>
      <button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser size={14} /></button>
    </div>
  );
}
