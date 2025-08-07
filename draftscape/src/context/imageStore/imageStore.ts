import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

interface ImageStore {
  imageMap: Record<string, string>; // ✅ Base64 or data URL instead of File
  setImage: (nodeId: string, file: File) => void;
  removeImage: (nodeId: string) => void;
  clearImages: () => void;
  setImages: (images: Record<string, string>) => void;
}

export const useImageStore = create<ImageStore>()(
  persist(
    (set, get) => ({
      imageMap: {},

      // ✅ Convert File to Base64 before storing
      setImage: (nodeId, file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          set((state) => ({
            imageMap: { ...state.imageMap, [nodeId]: base64 },
          }));
        };
        reader.readAsDataURL(file);
      },

      removeImage: (nodeId) =>
        set((state) => {
          const updated = { ...state.imageMap };
          delete updated[nodeId];
          return { imageMap: updated };
        }),

      clearImages: () => set({ imageMap: {} }),

      setImages: (images) => set({ imageMap: images }),
    }),
    {
      name: "draftscape-images",
      storage: createJSONStorage(() => ({
        getItem: async (name) => (await get(name)) ?? null,
        setItem: (name, value) => set(name, value),
        removeItem: (name) => del(name),
      })),
    }
  )
);
