import { create } from "zustand";
import type { CategoryId } from "@/data/categories";
import type { TypeFilter } from "@/data/repository";

// Feed filter state lives in a store (not screen state) so the desktop
// sidebar panel and the mobile/tablet filter bar drive the same feed.
interface FeedFilterState {
  type: TypeFilter;
  category: CategoryId | "All";
  setType: (type: TypeFilter) => void;
  setCategory: (category: CategoryId | "All") => void;
}

export const useFeedFilter = create<FeedFilterState>((set) => ({
  type: "All",
  category: "All",
  setType: (type) => set({ type }),
  setCategory: (category) => set({ category }),
}));
