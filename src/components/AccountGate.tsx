import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { PressableScale } from "./PressableScale";

// Full-tab gate for guests (Messages and Profile tabs): browsing the feed is
// free; these surfaces only exist for signed-in people.
export function AccountGate({ blurb }: { blurb: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.title}>Create your free account</Text>
      <Text style={styles.body}>{blurb}</Text>
      <PressableScale
        style={styles.cta}
        onPress={() => router.push({ pathname: "/welcome", params: { gate: "1" } })}
      >
        <Text style={styles.ctaText}>Sign up or log in</Text>
      </PressableScale>
      <Text style={styles.note}>Browsing jobs never needs an account.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: 30, paddingTop: 60 },
  emoji: { fontSize: 34, marginBottom: 12 },
  title: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, textAlign: "center" },
  body: {
    fontSize: 13,
    color: colors.inkMid,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 300,
  },
  cta: {
    marginTop: 18,
    backgroundColor: colors.safety,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  ctaText: { color: colors.white, fontFamily: fonts.display, fontSize: 14 },
  note: { marginTop: 12, fontSize: 11, color: colors.inkLo },
});
