import { create } from "zustand";
import type { TypeFilter } from "@/data/repository";
import type { TradeId } from "@/data/trades";

// Feed filter state lives in a store (not screen state) so the desktop
// sidebar panel and the mobile/tablet filter bar drive the same feed.
interface FeedFilterState {
  type: TypeFilter;
  trade: TradeId | "All";
  setType: (type: TypeFilter) => void;
  setTrade: (trade: TradeId | "All") => void;
}

export const useFeedFilter = create<FeedFilterState>((set) => ({
  type: "All",
  trade: "All",
  setType: (type) => set({ type }),
  setTrade: (trade) => set({ trade }),
}));
