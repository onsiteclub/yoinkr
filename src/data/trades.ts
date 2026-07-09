// Trade categories — carpentry-focused, Ottawa market. Used as the second feed
// filter axis and on job/worker listings. Keep ids stable (they map to a DB
// enum later); labels are display-only.
export const TRADES = [
  { id: "framing", label: "Framing" },
  { id: "roofing", label: "Roofing" },
  { id: "backframe", label: "Backframe" },
  { id: "general_labor", label: "General Labor" },
] as const;

export type TradeId = (typeof TRADES)[number]["id"];

export function tradeLabel(id: TradeId | null | undefined): string {
  return TRADES.find((t) => t.id === id)?.label ?? "";
}
