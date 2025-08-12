import { textItemFocusedStyle, textItemUnfocusedStyle } from "./outlinePanelStyles";
import type { TextNode } from "../../../context/storyStore/types";

interface TextItemProps {
  textNode: TextNode;
  color: string; // still passed for consistency, could be used in styles if needed
  focusedNodeId?: string;
  onFocusNode: (nodeId: string) => void;
}

export default function TextItem({
  textNode,
  color,
  focusedNodeId,
  onFocusNode,
}: TextItemProps) {
  const isFocused = focusedNodeId === textNode.id;

  return (
    <li
      style={{
        ...(isFocused ? textItemFocusedStyle : textItemUnfocusedStyle),
        borderLeft: `4px solid ${color}`, // optional: visually link to chapter/scene color
      }}
      onClick={(e) => {
        e.stopPropagation(); // prevent collapsing parent SceneItem
        onFocusNode(textNode.id);
      }}
    >
      📍 📝 {textNode.summary || "(No Summary)"}
    </li>
  );
}
