// Typography per branding/YOINKR-BRAND.md §6:
//   Display / brand — Manrope (800 wordmark & headlines, 700 subtitles, buttons)
//   UI / body     — Figtree (500–700)
// Condensed faces are retired. Families are loaded in app/_layout.tsx via
// @expo-google-fonts; these names match the loaded assets.
export const fonts = {
  display: "Manrope_800ExtraBold", // wordmark, H1, big numbers, buttons
  displaySub: "Manrope_700Bold", // subtitles
  body: "Figtree_500Medium",
  bodySemi: "Figtree_600SemiBold", // meta/labels
  bodyBold: "Figtree_700Bold", // card titles
} as const;
