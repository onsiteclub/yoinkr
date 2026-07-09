// Palette per branding/YOINKR-BRAND.md — Rota A · Site Orange (logo kit v0.1).
// One accent + warm ink + off-white surfaces. Hazard tape / safety amber /
// condensed-industrial language is retired (brand doc §11).
export const colors = {
  // --- canonical brand tokens ---
  accent: "#FF5A1F", // Site Orange — actions, highlights, the dot
  accentDark: "#E64A12", // Burnt — hover/pressed, text on tint
  accentTint: "#FFEBE3", // accent @ ~12% on white — chips, soft blocks
  inkBrand: "#1E1B18", // Char — text & symbol
  paper: "#FAFAF8", // page background
  warmPaper: "#FFF8F4", // soft brand background (splash, hero blocks)
  surface: "#FFFFFF",
  border: "#ECECE8",
  borderSoft: "#F2F2EE",
  secondary: "#6B6B65",
  tertiary: "#8A8A84",

  // --- functional (not brand accent routes) ---
  success: "#0F8C5C", // deal closed / verified
  successBg: "#EAF6F0",
  successLine: "#CBE7DA",
  danger: "#C9342C", // urgent, destructive
  dangerBg: "#FBEDEB",

  // --- legacy aliases (old token names → new values; migrate gradually) ---
  bg: "#FAFAF8",
  card: "#FFFFFF",
  cardAlt: "#FFF8F4",
  line: "#ECECE8",
  lineSoft: "#F2F2EE",
  ink: "#1E1B18",
  inkMid: "#6B6B65",
  inkLo: "#8A8A84",
  safety: "#FF5A1F",
  safetyInk: "#E64A12",
  safetyBg: "#FFEBE3",
  good: "#0F8C5C",
  goodBg: "#EAF6F0",
  goodLine: "#CBE7DA",
  hazard: "#C9342C",
  hazardBg: "#FBEDEB",
  blue: "#2456F0",
  white: "#FFFFFF",
} as const;

export type ColorName = keyof typeof colors;
