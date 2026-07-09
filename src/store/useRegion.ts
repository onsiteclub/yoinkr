import { create } from "zustand";
import { DEFAULT_REGION } from "@/data/regions";

// The city the feed is scoped to. Yoinkr is Ottawa-only at launch, so this
// defaults to Ottawa; picking another (coming-soon) city yields an empty feed.
interface RegionState {
  city: string;
  setCity: (city: string) => void;
}

export const useRegion = create<RegionState>((set) => ({
  city: DEFAULT_REGION,
  setCity: (city) => set({ city }),
}));
