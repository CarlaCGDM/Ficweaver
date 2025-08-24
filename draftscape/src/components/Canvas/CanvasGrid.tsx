import type { ReactNode } from "react";

export default function CanvasGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "1000000px",
        height: "1000000px",
        position: "relative",
        backgroundImage: `
          repeating-linear-gradient(var(--grid-line-color) 0 1px, transparent 1px 100%),
          repeating-linear-gradient(90deg, var(--grid-line-color) 0 1px, transparent 1px 100%)
        `,
        backgroundRepeat: "repeat",
        backgroundPosition: "0 0",
        backgroundSize: "40px 40px",
        transform: "translate(-10000px, -10000px)",
        backgroundColor: "var(--color-panel)"
      }}
    >
      {children}
    </div>
  );
}
