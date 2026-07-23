import { Linking, StyleSheet, Text, View } from "react-native";
import { track } from "@/data/analytics";
import type { AdContent } from "@/data/houseAds";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { PressableScale } from "./PressableScale";

// One ad slot in the feed. Deliberately quieter than a listing card (warm
// tint, no photo, clearly labeled "Sponsored") and fully generic: whatever
// AdContent it's handed, it renders — the feed and this component never
// change when real advertisers replace the house ads.
export function AdSlot({ ad }: { ad: AdContent }) {
  return (
    <PressableScale
      style={styles.card}
      onPress={() => {
        track("ad_tap", { ad: ad.id });
        Linking.openURL(ad.url);
      }}
    >
      <View style={styles.topRow}>
        <Text style={styles.sponsored}>SPONSORED · {ad.sponsor.toUpperCase()}</Text>
      </View>
      <View style={styles.bodyRow}>
        <View style={styles.mark}>
          <Text style={styles.markEmoji}>{ad.emoji}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>{ad.title}</Text>
          <Text style={styles.body}>{ad.body}</Text>
        </View>
      </View>
      <View style={styles.ctaRow}>
        <Text style={styles.cta}>{ad.cta} →</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sponsored: {
    fontSize: 9,
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.8,
    color: colors.tertiary,
  },
  bodyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  markEmoji: { fontSize: 20 },
  title: { fontSize: 14.5, fontFamily: fonts.bodyBold, color: colors.inkBrand },
  body: { fontSize: 12, color: colors.secondary, lineHeight: 17, marginTop: 3 },
  ctaRow: { marginTop: 10, alignItems: "flex-end" },
  cta: { fontSize: 12.5, fontFamily: fonts.bodySemi, color: colors.accentDark },
});
