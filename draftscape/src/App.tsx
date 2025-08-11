import { useRef, useState, useEffect } from "react";
import Toolbar from "./components/Toolbar/Toolbar";
import Footer from "./components/Footer/Footer";
import Canvas from "./components/Canvas/Canvas";
import OutlinePanel from "./components/Editor/OutlinePanel/OutlinePanel";
import TextEditor, { type TextEditorRef } from "./components/Editor/TextEditor/TextEditor";
import NodeEditModal from "./components/Editor/NodeEditModal/NodeEditModal";
import type { NodeData } from "./context/storyStore/types";
import AccessCodeModal from "./components/Payment/AccessCodeModal";
import { ThemeProvider } from "./context/themeProvider/ThemeProvider";

export default function App() {
  const focusNodeRef = useRef<((nodeId?: string) => void) | null>(null);
  const textEditorRef = useRef<TextEditorRef>(null);

  const [editingNode, setEditingNode] = useState<NodeData | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // 👇 NEW: editor visibility
  const [isEditorVisible, setIsEditorVisible] = useState(true);

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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'x' && !editingNode) {
        clearFocus();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [editingNode]);

  return (
    <ThemeProvider>
    <div className="app">
      <AccessCodeModal />

      <Toolbar />

      <div className="main-layout">
        <OutlinePanel
          onFocusNode={handleFocusNode}
          onEditNode={setEditingNode}
          focusedNodeId={focusedNodeId || undefined}
        />

        {/* Pass a class so the canvas can expand when editor is hidden */}
        <Canvas
          className={isEditorVisible ? "" : "editor-expanded"}
          onExposeFocus={(focus) => (focusNodeRef.current = focus)}
          onEditNode={setEditingNode}
          onFocusNode={handleFocusNode}
          focusedNodeId={focusedNodeId || undefined}
        />

        {/* One chevron button that hides/shows the editor */}
        <button
          className="toggle-editor"
          type="button"
          onClick={() => setIsEditorVisible(v => !v)}
          aria-label={isEditorVisible ? "Hide editor" : "Show editor"}
          title={isEditorVisible ? "Hide editor" : "Show editor"}
        >
          {isEditorVisible ? "›" : "‹"}
        </button>

        {/* Only render the editor when visible */}
        {isEditorVisible && (
          <TextEditor
            ref={textEditorRef}
            onFocusNode={handleFocusNode}
            focusedNodeId={focusedNodeId || undefined}
          />
        )}
      </div>

      {editingNode && <NodeEditModal node={editingNode} onClose={() => setEditingNode(null)} />}

      <Footer />
    </div>
    </ThemeProvider>
  );
}
