import type { Story } from "../types";

export const storyTitleActions = (set: any, get: any) => ({
  setStory: (story: Story, skipHistory = false) => {
    if (!skipHistory) get().pushHistory();
    set({ story });
  },


  updateStoryTitle: (title: string) => {
    get().pushHistory();
    set((state: any) => ({
      story: { ...state.story, title },
    }));
  },
});
