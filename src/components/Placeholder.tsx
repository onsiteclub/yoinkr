import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/theme/colors";

// Listing/portfolio image block.
// - http(s) URL (Supabase Storage public URL) → real photo via expo-image.
// - "ph:#aaa,#bbb" (seed placeholders) → two-stop gradient.
// - null → default gradient.
// Children (badges, captions) render on top in both cases.
function parseGradient(photoUrl: string | null): [string, string] {
  if (photoUrl && photoUrl.startsWith("ph:")) {
    const [a, b] = photoUrl.slice(3).split(",");
    if (a && b) return [a, b];
  }
  return ["#cfd6e6", "#aab4c8"];
}

export function Placeholder({
  photoUrl,
  style,
  children,
}: {
  photoUrl: string | null;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const isRealPhoto = !!photoUrl && /^https?:\/\//.test(photoUrl);

  if (isRealPhoto) {
    return (
      <View style={[style, { overflow: "hidden" }]}>
        <Image
          source={{ uri: photoUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
        {children}
      </View>
    );
  }

  const [a, b] = parseGradient(photoUrl);
  return (
    <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

export const PLACEHOLDER_FALLBACK = colors.line;
