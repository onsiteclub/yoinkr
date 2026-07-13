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

// Profiles store the display label ("Framing"); map it back to the stable id
// (used to pick trade-default artwork for portfolios).
export function tradeIdFromLabel(label: string | null | undefined): TradeId | null {
  if (!label) return null;
  const needle = label.trim().toLowerCase();
  return TRADES.find((t) => t.label.toLowerCase() === needle || t.id === needle)?.id ?? null;
}
