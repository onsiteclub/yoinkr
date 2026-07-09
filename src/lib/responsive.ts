import { useWindowDimensions } from "react-native";

// Single source of truth for breakpoints (RESPONSIVE-DIRECTIVE.md §1).
// Never read Dimensions.get() in components — always this hook (it re-renders
// on resize/rotation). Never hardcode pixel widths in screens.
export const BP = { md: 768, lg: 1024 } as const;

export type LayoutMode = "mobile" | "tablet" | "desktop";

// Card switches stacked → horizontal when ITS OWN width crosses this (§4).
export const CARD_HORIZONTAL_MIN = 560;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const mode: LayoutMode =
    width >= BP.lg ? "desktop" : width >= BP.md ? "tablet" : "mobile";
  return {
    width,
    height,
    mode,
    isMobile: mode === "mobile",
    isTablet: mode === "tablet",
    isDesktop: mode === "desktop",
    // content column width for feed-style screens:
    contentWidth: Math.min(width, 720),
  };
}
