import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoMark } from "@/components/Logo";
import { PressableScale } from "@/components/PressableScale";
import { updateMyProfile } from "@/data/repository";
import { TRADES, tradeLabel, type TradeId } from "@/data/trades";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// First-run profile setup. Anonymous users are created as "New worker" with no
// trade — this screen gives them a face before they yoink or message anyone.
// Three fields, no friction; skippable ("Later") since browsing works without it.
export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [trade, setTrade] = useState<TradeId | null>(null);
  const [years, setYears] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length >= 2 && trade !== null && !saving;

  const save = async () => {
    if (!canSave || !trade) return;
    setSaving(true);
    try {
      await updateMyProfile({
        fullName: name.trim(),
        trade: tradeLabel(trade),
        yearsExp: Math.max(0, parseInt(years, 10) || 0),
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.hero}>
            <LogoMark size={44} />
            <Text style={styles.title}>Set up your profile</Text>
            <Text style={styles.subtitle}>
              Your name and trade show on everything you post — it's how hirers decide.
            </Text>
          </View>

          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Carlos M."
            placeholderTextColor={colors.tertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { marginTop: 18 }]}>Your trade</Text>
          <View style={styles.tradeWrap}>
            {TRADES.map((t) => {
              const active = trade === t.id;
              return (
                <PressableScale
                  key={t.id}
                  onPress={() => setTrade(t.id)}
                  style={[
                    styles.tradeChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accentTint : colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.tradeText, { color: active ? colors.accentDark : colors.secondary }]}>
                    {t.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>Years of experience</Text>
          <TextInput
            style={[styles.input, { width: 120 }]}
            placeholder="0"
            placeholderTextColor={colors.tertiary}
            value={years}
            onChangeText={(v) => setYears(v.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={2}
          />

          <PressableScale
            onPress={save}
            disabled={!canSave}
            style={[styles.cta, { opacity: canSave ? 1 : 0.5 }]}
          >
            <Text style={styles.ctaText}>{saving ? "Saving…" : "Start using yoinkr"}</Text>
          </PressableScale>

          <PressableScale onPress={() => router.back()} hitSlop={8} style={styles.skip}>
            <Text style={styles.skipText}>Later</Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.warmPaper },
  body: { padding: 24 },
  hero: { alignItems: "center", paddingTop: 28, paddingBottom: 28 },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.inkBrand,
    marginTop: 14,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.secondary,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 300,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.inkBrand,
  },
  tradeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tradeChip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, borderWidth: 1.5 },
  tradeText: { fontSize: 13, fontFamily: fonts.bodySemi },
  cta: {
    marginTop: 28,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: { color: colors.white, fontFamily: fonts.display, fontSize: 15.5 },
  skip: { alignSelf: "center", marginTop: 16, padding: 6 },
  skipText: { fontSize: 13.5, color: colors.tertiary, fontFamily: fonts.bodySemi },
});
