import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

// Inline trust readout, shown wherever a person appears (feed cards, chat
// list/header, profile). The average only exists at 3+ ratings (trust=null
// below that — server rule), so the display degrades honestly:
//   "★ 4.8 · 23 closed" → "5 closed" (no avg yet) → "NEW" (nothing yet).
export function TrustInline({
  trust,
  dealsClosed,
}: {
  trust: number | null;
  dealsClosed: number;
}) {
  const isNew = trust == null && dealsClosed === 0;
  return (
    <View style={styles.row}>
      {isNew ? (
        <Text style={styles.newBadge}>NEW</Text>
      ) : (
        <>
          {trust != null && <Text style={styles.star}>★ {trust.toFixed(1)}</Text>}
          <Text style={styles.muted}>
            {trust != null ? "· " : ""}
            {dealsClosed} closed
          </Text>
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
