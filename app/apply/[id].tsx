import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { PressableScale } from "@/components/PressableScale";
import { TrustInline } from "@/components/TrustInline";
import { track } from "@/data/analytics";
import {
  applyToListing,
  getListing,
  getOrCreateConversation,
  sendMessage,
} from "@/data/repository";
import { hasAccount } from "@/data/supabase";
import type { Listing } from "@/data/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Apply to a job — the lightweight Upwork/Workana-style proposal: a short
// message plus an optional rate. No cover letters, no friction.
export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [listing, setListing] = useState<Listing | undefined>();
  const [message, setMessage] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Backstop gate (the feed already gates before navigating here).
    hasAccount().then((ok) => {
      if (!ok) router.replace({ pathname: "/welcome", params: { gate: "1" } });
    });
    if (id) getListing(id).then(setListing);
  }, [id]);

  const isOpen = listing?.status === "open";
  const canSend = message.trim().length > 0 && !saving && isOpen;

  // A yoink is also the first message (FB Marketplace model): the proposal
  // opens the conversation about this listing, so it shows up in the Messages
  // tab for BOTH sides immediately — no silent applications.
  const submit = async () => {
    if (!canSend || !listing) return;
    setSaving(true);
    try {
      const text = message.trim();
      const rateLine = rate.trim() ? `\nMy rate: ${rate.trim()}` : "";
      await applyToListing(listing.id, text, rate.trim());
      const convId = await getOrCreateConversation(listing.authorId, listing.id);
      await sendMessage(convId, `🪝 ${text}${rateLine}`);
      track("yoink_sent", { listing: listing.id, with_rate: !!rate.trim() });
      router.replace({ pathname: "/chat/[id]", params: { id: convId } });
    } catch {
      setSaving(false);
    }
  };

  if (!listing) return <View style={styles.screen} />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </PressableScale>
        <Text style={styles.headerTitle}>Yoink it</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.form}>
          {/* job summary */}
          <View style={styles.jobCard}>
            <Text style={styles.jobTitle}>{listing.title}</Text>
            <View style={styles.jobMeta}>
              <Text style={styles.jobPay}>{listing.pay}</Text>
              <Text style={styles.jobDetail}>· {listing.detail}</Text>
              <Text style={styles.jobPlace}>📍 {listing.location}</Text>
            </View>
            {!!listing.description && (
              <Text style={styles.jobDesc}>{listing.description}</Text>
            )}
            {!isOpen && (
              <Text style={styles.closedNote}>
                {listing.status === "pending"
                  ? "⏳ This job is pending — a deal is already in progress."
                  : "✓ This job is closed — it's not taking new yoinks."}
              </Text>
            )}
            <View style={styles.jobAuthor}>
              <Text style={styles.jobBy}>{listing.author.fullName}</Text>
              <TrustInline trust={listing.author.trustScore} dealsClosed={listing.author.dealsClosed} />
            </View>
          </View>

          <Text style={styles.label}>Your message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="I'm free Saturday, 6 yrs framing. Can start 7am."
            placeholderTextColor={colors.inkLo}
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <Text style={[styles.label, { marginTop: 14 }]}>Your rate (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder={listing.pay}
            placeholderTextColor={colors.inkLo}
            value={rate}
            onChangeText={setRate}
          />

          <PressableScale
            onPress={submit}
            disabled={!canSend}
            style={[styles.submitBtn, { opacity: canSend ? 1 : 0.5 }]}
          >
            <Text style={styles.submitText}>Yoink it</Text>
          </PressableScale>

          <Text style={styles.note}>
            The hirer sees your profile, trust score and references with this application.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
  },
  cancel: { fontSize: 14, color: colors.inkMid },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.ink,
  },
  form: { padding: 18, paddingBottom: 40 },
  jobCard: {
    backgroundColor: colors.safetyBg,
    borderWidth: 1,
    borderColor: "#F0D68A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  jobTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  jobMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  jobPay: { fontFamily: fonts.display, fontSize: 17, fontWeight: "800", color: colors.ink },
  jobDetail: { fontSize: 12, color: colors.inkMid },
  jobDesc: { fontSize: 13, color: colors.inkMid, lineHeight: 19, marginTop: 8 },
  closedNote: { fontSize: 12.5, color: colors.safetyInk, fontWeight: "700", marginTop: 10 },
  jobPlace: { marginLeft: "auto", fontSize: 11.5, color: colors.inkLo },
  jobAuthor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0D68A",
  },
  jobBy: { fontSize: 12.5, fontWeight: "700", color: colors.ink },
  label: { fontSize: 12, fontWeight: "700", color: colors.inkMid, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    marginTop: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
  },
  messageInput: { minHeight: 90, textAlignVertical: "top" },
  submitBtn: {
    marginTop: 22,
    backgroundColor: colors.safety,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: { color: colors.white, fontFamily: fonts.display, fontSize: 15 },
  note: { marginTop: 12, fontSize: 11, color: colors.inkLo, lineHeight: 16, textAlign: "center" },
});
