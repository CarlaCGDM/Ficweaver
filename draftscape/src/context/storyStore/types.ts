// ==============================
// 🏗 Shared Types
// ==============================
export interface Position {
  x: number;
  y: number;
}

export interface ImageData {
  id: string;
  filename: string;
  position: Position;
}

// Base for all nodes
export interface BaseNode {
  id: string;
  position: Position;
  tags?: string[]; // ✅ Tags supported across all nodes
}

// ==============================
// 📝 Node Types
// ==============================

export interface ChapterNode extends BaseNode {
  type: "chapter";
  title: string;
  description?: string; // Optional description
}

export interface SceneNode extends BaseNode {
  type: "scene";
  title: string;
  description?: string; // Optional description
}

export interface TextNode extends BaseNode {
  type: "text";
  summary?: string; // Short summary for outline view
  text: string; // Full rich-text content (HTML from editor)
  images: ImageData[];
  sticker?: {
    imageIndex: number;               // 1–7
    corner: "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  };
}

export interface PictureNode extends BaseNode {
  type: "picture";
  description: string; // Short label/description of the picture
  color: string;       // Background color (earth tone)
  connectedTo?: string; // ID of the node it's linked to
}

export interface AnnotationNode extends BaseNode {
  type: "annotation";
  text: string;         // Longer note or comment
  connectedTo?: string; // ID of the node it's linked to
}

export interface EventNode extends BaseNode {
  type: "event";
  year: number;
  month?: number;
  day?: number;
  title: string;     // Short non-rich description
  description?: string;
  tags: string[];    // Freeform tags (characters, locations, etc.)
  connectedTo?: string;
}


// Union of all node types for flexible handling
export type NodeData =
  | ChapterNode
  | SceneNode
  | TextNode
  | PictureNode
  | AnnotationNode
  | EventNode;

// ==============================
// 📚 Higher-level Structures
// ==============================

export interface Scene {
  id: string;
  title: string;
  color: string;
  nodes: NodeData[];
}

export interface Chapter {
  id: string;
  title: string;
  chapterNode: ChapterNode;
  color: string;
  scenes: Scene[];
}

export interface Story {
  title: string;
  chapters: Chapter[];
}

// ==============================
// 🔧 State and Actions
// ==============================

export interface StoryState {
  story: Story;
  selectedNodeId: string | null;

  setStory: (story: Story, skipHistory?: boolean) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  updateNodePosition: (nodeId: string, pos: Position, isFromDrag?: boolean) => void;

  addChapter: (insertAfterNodeId?: string) => void;
  addScene: (chapterId: string, insertAfterNodeId?: string) => void;
  addTextNode: (sceneId: string, insertAfterNodeId?: string) => void;
  deleteNode: (nodeId: string) => void;

  updateNodeData?: (nodeId: string, updates: Partial<NodeData>) => void;

  // ✅ Add these:
  addPictureNode: (connectToNodeId?: string) => void;
  addAnnotationNode: (connectToNodeId?: string) => void;

  addEventNode: (connectToNodeId: string | null) => void;
  updateEventNode: (nodeId: string, updates: Partial<EventNode>) => void;
  deleteEventNode: (nodeId: string) => void;

}

