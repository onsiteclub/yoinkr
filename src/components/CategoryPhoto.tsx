import { Image } from "expo-image";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { CategoryId } from "@/data/categories";
import { fonts } from "@/theme/fonts";

// Real jobsite photos bundled as category placeholders — shown whenever a
// listing or portfolio has no photos of its own. Deterministic pick by `seed`
// (or explicit `variant`) so the same card always shows the same photo.
// Bundled in the app: zero Storage egress. The SAMPLE pill keeps system
// photos from ever passing as the worker's own work (trust rule).
const PHOTOS: Record<CategoryId, number[]> = {
  framing: [require("../../assets/categories/framing.jpg")],
  roof_framing: [require("../../assets/categories/roof-framing.jpg")],
  backframing: [require("../../assets/categories/backframing-1.jpg")],
  strapping: [require("../../assets/categories/strapping.jpg")],
  general_labour: [require("../../assets/categories/general-labour.jpg")],
};

export function categoryPhotoCount(category: CategoryId): number {
  return PHOTOS[category].length;
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function CategoryPhoto({
  category,
  seed = "",
  variant,
  style,
  children,
}: {
  category: CategoryId;
  seed?: string;
  variant?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const photos = PHOTOS[category];
  const source = photos[(variant ?? hashSeed(seed)) % photos.length];
  return (
    <View style={[style, { overflow: "hidden" }]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      {children}
    </View>
  );
}

// Small overlay tag for default tiles, so system photos are never mistaken
// for the worker's own.
export function SamplePill() {
  return (
    <View style={pill.wrap}>
      <Text style={pill.text}>SAMPLE</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(30,27,24,0.45)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: { color: "#FFFFFF", fontSize: 9, letterSpacing: 1, fontFamily: fonts.bodySemi },
});
