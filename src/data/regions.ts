// Yoinkr launches in OTTAWA ONLY. Other Canadian cities are listed as
// "coming soon" so the region scope is unmistakable and the expansion story is
// visible — selecting one shows an empty, honest "not here yet" state.
export interface Region {
  id: string;
  name: string;
  live: boolean;
}

export const REGIONS: Region[] = [
  { id: "ottawa", name: "Ottawa", live: true },
  { id: "gatineau", name: "Gatineau", live: false },
  { id: "toronto", name: "Toronto", live: false },
  { id: "montreal", name: "Montréal", live: false },
  { id: "vancouver", name: "Vancouver", live: false },
  { id: "calgary", name: "Calgary", live: false },
  { id: "edmonton", name: "Edmonton", live: false },
];

// Neighbourhoods that count as "Ottawa" for listings (shown on cards already).
export const OTTAWA_AREAS = [
  "Ottawa",
  "Kanata",
  "Nepean",
  "Orleans",
  "Barrhaven",
  "Gloucester",
  "Vanier",
  "Ottawa area",
];

export const DEFAULT_REGION = "Ottawa";
