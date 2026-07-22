import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Profile picture when there is one; otherwise the industrial fallback —
// dark slate square with an amber initial (mockup style).
export function Avatar({
  letter,
  photoUrl,
  size = 40,
}: {
  letter: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const radius = size > 50 ? 16 : 10;

  if (photoUrl) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}>
        <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#1E1B18", "#3B352F"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.box, { width: size, height: size, borderRadius: radius }]}
    >
      <Text
        style={{
          fontFamily: fonts.display,
          color: colors.accent,
          fontSize: size * 0.42,
        }}
      >
        {letter}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
});
