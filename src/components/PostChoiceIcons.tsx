import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "@/theme/colors";

// Icons for the "+" chooser (I'm hiring / I want work), drawn inline in the
// brand language — Char ink strokes with one Site Orange accent — replacing
// the platform emojis that never matched the design system (project style:
// react-native-svg, no icon fonts; see the marks in welcome.tsx).

// "I'm hiring" — a megaphone: you're announcing a job to the crews.
export function HiringGlyph({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M5 13a2.5 2.5 0 0 1 2.5-2.5H12L21.5 6a1 1 0 0 1 1.5.9v18.2a1 1 0 0 1-1.5.9L12 21.5H7.5A2.5 2.5 0 0 1 5 19v-6Z"
        stroke={colors.inkBrand}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 21.5V25a1.5 1.5 0 0 0 1.5 1.5h.8a1.5 1.5 0 0 0 1.5-1.5v-3.5"
        stroke={colors.inkBrand}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M26.5 12.5a5.5 5.5 0 0 1 0 7"
        stroke={colors.accent}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// "I want work" — a hard hat: you're the one showing up on site.
export function WorkGlyph({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M6.5 19.5v-1a9.5 9.5 0 0 1 19 0v1"
        stroke={colors.inkBrand}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Rect
        x={3.75}
        y={19.5}
        width={24.5}
        height={3.5}
        rx={1.75}
        stroke={colors.inkBrand}
        strokeWidth={1.8}
      />
      <Rect x={14.4} y={7.6} width={3.2} height={7} rx={1.6} fill={colors.accent} />
    </Svg>
  );
}

// "Selling a tool" — a wrench head; used wherever the tool door needs a mark.
export function ToolGlyph({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M19.8 6.2a6 6 0 0 0-7.6 7.5L6 20a3 3 0 0 0 0 4.3l1.7 1.7a3 3 0 0 0 4.3 0l6.3-6.2a6 6 0 0 0 7.5-7.6l-3.9 3.9-3.4-.9-.9-3.4 4.2-4.2Z"
        stroke={colors.inkBrand}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
