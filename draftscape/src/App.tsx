import { useRef, useState, useEffect } from "react";
import Toolbar from "./components/Toolbar/Toolbar";
import Footer from "./components/Footer/Footer";
import Canvas from "./components/Canvas/Canvas";
import OutlinePanel from "./components/Editor/OutlinePanel/OutlinePanel";
import TextEditor, { type TextEditorRef } from "./components/Editor/TextEditor/TextEditor";
import NodeEditModal from "./components/Editor/NodeEditModal/NodeEditModal";
import type { NodeData } from "./context/storyStore/types";
import AccessCodeModal from "./components/Payment/AccessCodeModal";

export default function App() {
  const focusNodeRef = useRef<((nodeId?: string) => void) | null>(null);
  const textEditorRef = useRef<TextEditorRef>(null);

  const [editingNode, setEditingNode] = useState<NodeData | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const handleFocusNode = (nodeId?: string) => {
    if (!nodeId) return;
    focusNodeRef.current?.(nodeId);
    textEditorRef.current?.scrollToNode(nodeId);
    setFocusedNodeId(nodeId);
  };

  const clearFocus = () => {
    setFocusedNodeId(null);
    console.log("🔄 Focus cleared");
  };

  // ✅ Add keyboard listener for X key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only clear focus if not editing a node and X key is pressed
      if (e.key.toLowerCase() === 'x' && !editingNode) {
        clearFocus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [editingNode]); // Re-run when editingNode changes

  return (
    <div className="app">
      <AccessCodeModal /> {/* 🔒 Prompt first-time visitors */}
      
      <Toolbar />

      <div className="main-layout">
        <OutlinePanel
          onFocusNode={handleFocusNode}
          onEditNode={setEditingNode}
          focusedNodeId={focusedNodeId || undefined}
        />

        <Canvas
          onExposeFocus={(focus) => (focusNodeRef.current = focus)}
          onEditNode={setEditingNode}
          onFocusNode={handleFocusNode}
          focusedNodeId={focusedNodeId || undefined}
        />

        <TextEditor
          ref={textEditorRef}
          onFocusNode={handleFocusNode}
          focusedNodeId={focusedNodeId || undefined} />
      </div>

      {editingNode && <NodeEditModal node={editingNode} onClose={() => setEditingNode(null)} />}

      <Footer />
    </div>
  );
}