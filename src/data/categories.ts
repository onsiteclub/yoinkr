// Framing categories — the app is framing-only (Ottawa); these are the four
// things a person can be or a listing can ask for. Ids are stable (they map
// to the DB check constraints); labels are display-only.
//
// Pricing rule (founder decision 2026-07-18): any category can work hourly;
// piecework ($/sqft or fixed price) exists only for the three skilled
// categories — general labour is hourly-only.
export const CATEGORIES = [
  { id: "framing", label: "Framer", piecework: true },
  { id: "roof_framing", label: "Roof framer", piecework: true },
  { id: "backframing", label: "Backframer", piecework: true },
  { id: "strapping", label: "Strapping", piecework: true },
  { id: "general_labour", label: "General labour", piecework: false },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryLabel(id: CategoryId | null | undefined): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "";
}

export function allowsPiecework(id: CategoryId | null | undefined): boolean {
  return CATEGORIES.find((c) => c.id === id)?.piecework ?? false;
}

export function categoryLabels(ids: CategoryId[]): string {
  return ids.map(categoryLabel).filter(Boolean).join(" · ");
}

// ---- structured pay ----

export type PayModel = "hourly" | "per_sqft" | "fixed";

export const PAY_MODELS: { id: PayModel; label: string }[] = [
  { id: "hourly", label: "Hourly" },
  { id: "per_sqft", label: "Per sqft" },
  { id: "fixed", label: "Fixed price" },
];

// "$34/hr" · "$2.10/sqft" · "$2,400" — the one way a price renders anywhere.
export function payLabel(model: PayModel | null, rate: number | null): string {
  if (rate == null || model == null) return "—";
  if (model === "hourly") return `$${trimMoney(rate)}/hr`;
  if (model === "per_sqft") return `$${rate.toFixed(2)}/sqft`;
  return `$${Math.round(rate).toLocaleString("en-CA")}`;
}

function trimMoney(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
