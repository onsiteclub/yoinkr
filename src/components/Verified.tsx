import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

// Small green check badge shown next to verified names.
export function Verified({ size = 15 }: { size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.check, { fontSize: size * 0.66 }]}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.good,
  },
  check: { color: colors.white, fontWeight: "900", lineHeight: 15 },
});
