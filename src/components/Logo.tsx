import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@/theme/colors";

// The yoinkr symbol (branding/logo-kit/svg/mark.svg): a round-terminal
// geometric y whose right arm curls into a hook, catching the dot. Positive
// lockup = glyph in ink, dot in accent (the only coloured element).
export function LogoMark({
  size = 28,
  color = colors.inkBrand,
  dotColor = colors.accent,
}: {
  size?: number;
  color?: string;
  dotColor?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path
        d="M30 26 L60 62 L60 100"
        stroke={color}
        strokeWidth={19}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M60 62 C 70 48, 80 38, 91 36 C 101 34.5, 106 43, 100 50"
        stroke={color}
        strokeWidth={19}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={88} cy={62} r={10} fill={dotColor} />
    </Svg>
  );
}
