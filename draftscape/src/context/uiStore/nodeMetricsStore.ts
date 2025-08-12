import { create } from "zustand";

type Size = { width: number; height: number };

type MetricsState = {
  sizeMap: Record<string, Size>;
  setNodeSize: (id: string, size: Size) => void;
  getHeight: (id: string) => number | undefined;
};

export const useNodeMetricsStore = create<MetricsState>((set, get) => ({
  sizeMap: {},
  setNodeSize: (id, size) =>
    set((s) => ({ sizeMap: { ...s.sizeMap, [id]: size } })),
  getHeight: (id) => get().sizeMap[id]?.height,
}));
