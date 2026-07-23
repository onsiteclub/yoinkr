import { StyleSheet, Text, View } from "react-native";
import { categoryLabel } from "@/data/categories";
import type { Profile } from "@/data/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// The at-a-glance block both profile screens share (redesign 2026-07-23):
// numbers first — big star average (or NEW), jobs closed, years — then what
// the person does as chips. No sentences: the eye gets it in one pass, the
// prose that used to explain trust lives nowhere now (the numbers ARE it).
export function ProfileGlance({ profile }: { profile: Profile }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.statRow}>
        <View style={styles.statCol}>
          {profile.trustScore != null ? (
            <Text style={styles.score}>★ {profile.trustScore.toFixed(1)}</Text>
          ) : (
            <Text style={styles.newPill}>NEW</Text>
          )}
          <Text style={styles.statLabel}>
            {profile.ratingCount > 0
              ? `${profile.ratingCount} rating${profile.ratingCount > 1 ? "s" : ""}`
              : "no ratings"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.stat}>{profile.dealsClosed}</Text>
          <Text style={styles.statLabel}>closed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.stat}>{profile.yearsExp}</Text>
          <Text style={styles.statLabel}>years</Text>
        </View>
      </View>

      <View style={styles.chips}>
        {profile.categories.map((c) => (
          <View key={c} style={styles.chip}>
            <Text style={styles.chipText}>{categoryLabel(c)}</Text>
          </View>
        ))}
        {profile.hires && (
          <View style={[styles.chip, styles.chipInk]}>
            <Text style={[styles.chipText, styles.chipInkText]}>Hires</Text>
          </View>
        )}
        {profile.crewSize === 2 && profile.categories.length > 0 && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>Duo</Text>
          </View>
        )}
        {profile.vouchCount > 0 && (
          <View style={[styles.chip, styles.chipGood]}>
            <Text style={[styles.chipText, styles.chipGoodText]}>
              {profile.vouchCount} vouch{profile.vouchCount > 1 ? "es" : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 14,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  statCol: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, height: 34, backgroundColor: colors.lineSoft },
  score: { fontFamily: fonts.display, fontSize: 28, color: colors.good },
  stat: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  newPill: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.accentDark,
    backgroundColor: colors.accentTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 10,
    color: colors.inkLo,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  chip: {
    backgroundColor: colors.accentTint,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontFamily: fonts.bodySemi, color: colors.accentDark },
  chipInk: { backgroundColor: colors.ink },
  chipInkText: { color: colors.white },
  chipGood: { backgroundColor: colors.goodBg },
  chipGoodText: { color: colors.good },
});
