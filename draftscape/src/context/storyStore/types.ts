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

// ==============================
// 📝 Base Node Structure
// ==============================
export type NodeType =
  | "chapter"
  | "scene"
  | "text"
  | "picture"
  | "annotation"
  | "event";

export interface BaseNode {
  id: string;
  type: NodeType;
  parentId: string | null; // null = top-level (chapter)
  position: Position;
  tags?: string[];
}

// ==============================
// 📦 Node Definitions
// ==============================
export interface ChapterNode extends BaseNode {
  type: "chapter";
  title: string;
  description?: string;
}

export interface SceneNode extends BaseNode {
  type: "scene";
  title: string;
  description?: string;
}

export interface TextNode extends BaseNode {
  type: "text";
  summary?: string;
  text: string;
  images: ImageData[];
  sticker?: {
    imageIndex: number; // 1–7
    corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  };
}

export interface PictureNode extends BaseNode {
  type: "picture";
  description: string;
}

export interface AnnotationNode extends BaseNode {
  type: "annotation";
  text: string;
}

export interface EventNode extends BaseNode {
  type: "event";
  year: number;
  month?: number;
  day?: number;
  title: string;
  description?: string;
  tags: string[];
}

// ==============================
// 🔗 Node Union
// ==============================
export type NodeData =
  | ChapterNode
  | SceneNode
  | TextNode
  | PictureNode
  | AnnotationNode
  | EventNode;

// ==============================
// 📚 Story Structure
// ==============================
// All nodes stored flat
export interface Story {
  title: string;
  nodeMap: Record<string, NodeData>; // All nodes in one map
  order: string[]; // Ordered list of top-level chapter IDs
  childrenOrder: Record<string, string[]>; // key = parentId, value = ordered child IDs
}

// ==============================
// 🔧 State & Actions
// ==============================
export interface StoryState {
  story: Story;
  selectedNodeId: string | null;

  setStory: (story: Story, skipHistory?: boolean) => void;
  updateNode: (nodeId: string, updates: Partial<NodeData>) => void;
  updateNodePosition: (nodeId: string, pos: Position, isFromDrag?: boolean) => void;
  updateManyNodePositions: (updates: Array<{ id: string; x: number; y: number }>, isFromDrag?: boolean) => void;

  // ==============================
  // Chapter CRUD
  // ==============================
  createChapter: (title: string, insertAfterId?: string) => void;
  updateChapter: (id: string, updates: Partial<ChapterNode>) => void;
  deleteChapter: (id: string) => void;

  // ==============================
  // Scene CRUD
  // ==============================
  createScene: (parentChapterId: string, title: string, insertAfterId?: string,  options?: { atStart?: boolean }) => void;
  updateScene: (id: string, updates: Partial<SceneNode>) => void;
  deleteScene: (id: string) => void;

  // ==============================
  // Text CRUD
  // ==============================
  createText: (parentId: string, insertAfterId?: string, options?: { atStart?: boolean }) => void;
  updateText: (id: string, updates: Partial<TextNode>) => void;
  deleteText: (id: string) => void;

  // ==============================
  // Picture CRUD
  // ==============================
  createPicture: (parentId: string, insertAfterId?: string) => void;
  updatePicture: (id: string, updates: Partial<PictureNode>) => void;
  deletePicture: (id: string) => void;

  // ==============================
  // Annotation CRUD
  // ==============================
  createAnnotation: (parentId: string, insertAfterId?: string) => void;
  updateAnnotation: (id: string, updates: Partial<AnnotationNode>) => void;
  deleteAnnotation: (id: string) => void;

  // ==============================
  // Event CRUD
  // ==============================
  createEvent: (parentId: string, insertAfterId?: string) => void;
  updateEvent: (id: string, updates: Partial<EventNode>) => void;
  deleteEvent: (id: string) => void;

  // ==============================
  // Re-parenting / moving
  // ==============================
  reorderChapters: (orderedIds: string[]) => void; 
  moveNode: (
    nodeId: string,
    newParentId: string | null,
    insertAfterId?: string | null,
    options?: { atStart?: boolean }   
  ) => void;
}


