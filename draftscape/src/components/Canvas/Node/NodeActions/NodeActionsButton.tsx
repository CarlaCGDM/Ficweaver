// src/components/Canvas/Node/NodeActions/NodeActionsButton.tsx
import React from "react";

type Props = {
  title: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>; // <-- change
  bg?: string;
  disabled?: boolean;
  children: React.ReactNode;
};

export default function NodeActionsButton({
  title,
  onClick,
  bg = "var(--color-panelAlt)",
  disabled,
  children,
}: Props) {
  return (
    <button
      title={title}
      onClick={onClick}          // <-- now matches the type
      disabled={disabled}
      style={{
        background: bg,
        color: "var(--color-text)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 14,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
