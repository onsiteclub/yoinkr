import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import type { ListingType } from "@/data/types";

const TYPE_LABEL: Record<ListingType, { txt: string; ink: string; bg: string }> = {
  job: { txt: "JOB", ink: colors.safetyInk, bg: colors.safetyBg },
  tool: { txt: "TOOL", ink: "#1746a2", bg: "#E7EEFC" },
  available: { txt: "WORKER", ink: "#0a6b41", bg: colors.goodBg },
};

export function TypeBadge({ type }: { type: ListingType }) {
  const lab = TYPE_LABEL[type];
  return (
    <View style={[styles.badge, { backgroundColor: lab.bg }]}>
      <Text style={[styles.text, { color: lab.ink }]}>{lab.txt}</Text>
    </View>
  );
}

export function UrgentBadge() {
  return (
    <View style={[styles.badge, { backgroundColor: colors.hazard }]}>
      <Text style={[styles.text, { color: colors.white }]}>● URGENT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  text: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
});
