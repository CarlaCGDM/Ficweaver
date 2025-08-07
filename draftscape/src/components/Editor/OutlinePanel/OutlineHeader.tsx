import { Edit } from "lucide-react";
import { titleRowStyle, buttonStyle } from "./outlinePanelStyles";

interface OutlineHeaderProps {
  title: string;
  onEditTitle: () => void;
}

export default function OutlineHeader({ title, onEditTitle }: OutlineHeaderProps) {
  return (
    <div style={titleRowStyle}>
      <h2 style={{ margin: 0 }}>{title || "New Story"}</h2>
      <button style={buttonStyle} onClick={onEditTitle}>
        <Edit size={16} />
      </button>
    </div>
  );
}
