import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

// Inline trust readout: "★ 4.8 · 23 closed". Shown wherever a person appears
// (feed cards, chat list/header, profile) — HANDOFF.md §4.
export function TrustInline({ trust, dealsClosed }: { trust: number; dealsClosed: number }) {
  const isNew = dealsClosed === 0;
  return (
    <View style={styles.row}>
      {isNew ? (
        <Text style={styles.newBadge}>NEW</Text>
      ) : (
        <>
          <Text style={styles.star}>★ {trust.toFixed(1)}</Text>
          <Text style={styles.muted}>· {dealsClosed} closed</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  star: { color: colors.good, fontWeight: "800", fontSize: 11.5 },
  muted: { color: colors.inkLo, fontSize: 11.5 },
  newBadge: {
    color: colors.safetyInk,
    backgroundColor: colors.safetyBg,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
});
