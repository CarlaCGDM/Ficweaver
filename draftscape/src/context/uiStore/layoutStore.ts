import { create } from "zustand";

type LayoutState = {
  /** When true, components must not apply auto layout shifts (e.g., in ResizeObserver). */
  suppressAutoLayout: boolean;

  /** Set/clear suppression explicitly. */
  setSuppress: (value: boolean) => void;

  /** Convenience: suppress for a single animation frame. */
  suppressForNextFrame: () => void;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  suppressAutoLayout: false,
  setSuppress: (value) => set({ suppressAutoLayout: value }),
  suppressForNextFrame: () => {
    set({ suppressAutoLayout: true });
    requestAnimationFrame(() => set({ suppressAutoLayout: false }));
  },
}));
