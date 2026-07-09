import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Dark slate square with an amber initial — the industrial avatar from the mockup.
export function Avatar({ letter, size = 40 }: { letter: string; size?: number }) {
  return (
    <LinearGradient
      colors={["#1E1B18", "#3B352F"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size > 50 ? 16 : 10 },
      ]}
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
