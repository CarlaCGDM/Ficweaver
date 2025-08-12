import type { NodeData } from "../../../context/storyStore/types";
import ChapterNode from "./ChapterNode";
import SceneNode from "./SceneNode";
import TextNode from "./TextNode";
import PictureNode from "./PictureNode";
import AnnotationNode from "./AnnotationNode";
import EventNode from "./EventNode";

export interface NodeProps {
  node: NodeData;
  parentChapterId?: string;
  parentSceneId?: string;

  // Accept either a numeric palette index or a custom string color
  chapterColor?: number | string;

  isDragging: boolean;
  isInDragGroup: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string, x: number, y: number) => void;
  onEditNode: (node: NodeData) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  chapterIndex?: number;
  sceneIndex?: number;
  focusedNodeId?: string;
}

export default function Node(props: NodeProps) {
  const { node, onDoubleClick } = props;

  const commonProps = {
    ...props,
    onDoubleClick,
  };

  switch (node.type) {
    case "chapter":
      return <ChapterNode {...commonProps} />;
    case "scene":
      return <SceneNode {...commonProps} />;
    case "text":
      return <TextNode {...commonProps} />;
    case "picture":
      return <PictureNode {...commonProps} />;
    case "annotation":
      return <AnnotationNode {...commonProps} />;
    case "event":
      return <EventNode {...commonProps} />;
    default:
      return null;
  }
}
