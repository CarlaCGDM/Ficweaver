import { textItemFocusedStyle, textItemUnfocusedStyle } from "./outlinePanelStyles";
import type { TextNode } from "../../../context/storyStore/types";

interface TextItemProps {
  textNode: TextNode;
  color: string;
  focusedNodeId?: string;
  onFocusNode: (nodeId: string) => void;
}

export default function TextItem({ textNode, focusedNodeId, onFocusNode }: TextItemProps) {
  const isFocused = focusedNodeId === textNode.id;

  return (
    <li
      style={isFocused ? textItemFocusedStyle : textItemUnfocusedStyle}
      onClick={() => {
        console.log("Text clicked:", textNode.id);
        onFocusNode(textNode.id);
      }}
    >
      📍 📝 {textNode.summary || "(No Summary)"}
    </li>
  );
}


