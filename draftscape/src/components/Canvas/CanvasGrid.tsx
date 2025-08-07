// src/components/Canvas/CanvasGrid.tsx
import type { ReactNode } from "react";

export default function CanvasGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100000px",
        height: "100000px",
        position: "relative",
        background:
          "repeating-linear-gradient(#eee 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #eee 0 1px, transparent 1px 100%)",
        backgroundSize: "40px 40px",
        transform: "translate(-1000px, -1000px)",

      }}
    >
      {children}
    </div>
  );
}
