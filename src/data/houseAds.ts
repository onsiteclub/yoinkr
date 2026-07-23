// Ad slot content. The feed doesn't know WHAT fills a slot — it just asks
// adForSlot(n). Today that returns house ads for the holding's other products
// (Kijiji free-tier model); when real advertisers arrive, this module swaps
// its source (remote config / ad server) without touching the feed or the
// AdSlot component.

export interface AdContent {
  id: string;
  sponsor: string; // who the ad is from — always shown (it's an ad, say so)
  emoji: string; // lightweight mark until sponsors bring real art
  title: string;
  body: string;
  cta: string;
  url: string; // where the tap goes
}

const HOUSE_ADS: AdContent[] = [
  {
    id: "onsite-shop",
    sponsor: "OnSite Club",
    emoji: "🛠️",
    title: "Gear priced for the crew",
    body: "Boots, tools and job-site gear in the OnSite shop — same account you use here.",
    cta: "Visit the shop",
    url: "https://shop.onsiteclub.ca",
  },
  {
    id: "invoicepass",
    sponsor: "InvoicePass",
    emoji: "🧾",
    title: "Invoices that get you paid",
    body: "Signed, sent and tracked — professional invoices for independent trades.",
    cta: "Try InvoicePass",
    url: "https://invoicepass.app",
  },
  {
    id: "onsite-timekeeper",
    sponsor: "OnSite Club",
    emoji: "⏱️",
    title: "Prove your hours",
    body: "Clock your job-site time with OnSite Timekeeper — verified hours back your reputation.",
    cta: "Get Timekeeper",
    url: "https://onsiteclub.ca",
  },
];

// Slot n (0-based) → its ad, rotating through the pool.
export function adForSlot(slot: number): AdContent {
  return HOUSE_ADS[slot % HOUSE_ADS.length];
}
