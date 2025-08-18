// src/components/Canvas/Node/StickerOverlay.tsx
import { useEffect, useState } from "react";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type StickerSpec = { imageIndex: number; corner: Corner };

// Accept any "ref-like" host with a current HTMLElement or null
type HostRefLike = { current: HTMLElement | null };

interface Props {
  hostRef: HostRefLike;                            // ⬅️ changed
  nodeId: string;
  nodePosition: { x: number; y: number };
  sticker?: StickerSpec;
  basePath: string;
}

export default function StickerOverlay({
  hostRef,
  nodeId,
  nodePosition,
  sticker,
  basePath,
}: Props) {
  const [exists, setExists] = useState(true);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const report = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hostRef, nodeId]);

  if (!sticker || !exists) return null;

  const src = `${basePath}/${String(sticker.imageIndex).padStart(2, "0")}.png`;
  const cornerStyle: React.CSSProperties =
    sticker.corner === "top-left"
      ? { top: 0, left: 0 }
      : sticker.corner === "top-right"
      ? { top: 0, right: 0 }
      : sticker.corner === "bottom-left"
      ? { bottom: 0, left: 0 }
      : { bottom: 0, right: 0 };

  return (
    <div
      style={{
        position: "absolute",
        top: nodePosition.y - 50,
        left: nodePosition.x - 50,
        width: size.w + 100,
        height: size.h + 100,
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <img
        src={src}
        alt="Sticker"
        onError={() => setExists(false)}
        style={{ position: "absolute", width: 100, height: 100, pointerEvents: "none", ...cornerStyle }}
      />
    </div>
  );
}
