import { LifeBuoy } from "lucide-react";

type Props = {
  onClick: () => void;
  title?: string;
  style?: React.CSSProperties;
};

export default function TutorialLauncherButton({ onClick, title = "Open tutorial", style }: Props) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "1vh",
        left: "1vh",
        zIndex: 3500,
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: "1px solid var(--color-border)",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        boxShadow: "var(--node-shadow)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        ...style,
      }}
    >
      <LifeBuoy size={18} />
    </button>
  );
}
