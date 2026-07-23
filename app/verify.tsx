import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/PressableScale";
import { Verified } from "@/components/Verified";
import { track } from "@/data/analytics";
import { markVerified } from "@/data/repository";
import { confirmVerifyCode, currentUserEmail, sendVerifyCode } from "@/data/supabase";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Optional email verification. Signup is instant (autoconfirm), so the email
// was never proven — this closes that loop whenever the person feels like it:
// we mail a 6-digit code, they type it back, the profile gets the ✓ badge and
// password recovery becomes trustworthy. Skipping it blocks nothing.
export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    currentUserEmail().then((e) => {
      if (!e) router.replace({ pathname: "/welcome", params: { gate: "1" } });
      else setEmail(e);
    });
  }, []);

  const sendCode = async () => {
    if (!email || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendVerifyCode(email);
      track("verify_started");
      setSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        /rate limit/i.test(msg)
          ? "Too many emails just now — try again in an hour."
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!email || code.trim().length < 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await confirmVerifyCode(email, code.trim());
      await markVerified();
      track("verify_done");
      setDone(true);
    } catch {
      setError("That code didn't match — check the email and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>{done ? "Done" : "Later"}</Text>
        </PressableScale>
        <Text style={styles.headerTitle}>Verify email</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.badgeHero}>
            <Verified size={40} />
          </View>

          {done ? (
            <>
              <Text style={styles.title}>You're verified ✓</Text>
              <Text style={styles.blurb}>
                The badge now shows next to your name everywhere — and if you ever lose your
                password, this email gets you back in.
              </Text>
              <PressableScale style={styles.cta} onPress={() => router.back()}>
                <Text style={styles.ctaText}>Back to profile</Text>
              </PressableScale>
            </>
          ) : (
            <>
              <Text style={styles.title}>One minute, one badge</Text>
              <Text style={styles.blurb}>
                We'll email a 6-digit code to{" "}
                <Text style={{ fontFamily: fonts.bodyBold, color: colors.inkBrand }}>
                  {email ?? "…"}
                </Text>
                . Typing it back proves the email is yours: your name gets the ✓ badge and
                account recovery starts working. Totally optional — the app works the same
                without it.
              </Text>

              {!sent ? (
                <PressableScale style={[styles.cta, busy && { opacity: 0.6 }]} onPress={sendCode} disabled={busy}>
                  <Text style={styles.ctaText}>{busy ? "Sending…" : "Email me the code"}</Text>
                </PressableScale>
              ) : (
                <>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="000000"
                    placeholderTextColor={colors.tertiary}
                    value={code}
                    onChangeText={(v) => {
                      setCode(v.replace(/[^0-9]/g, ""));
                      if (error) setError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  <PressableScale
                    style={[styles.cta, (busy || code.length < 6) && { opacity: 0.6 }]}
                    onPress={confirm}
                    disabled={busy || code.length < 6}
                  >
                    <Text style={styles.ctaText}>{busy ? "Checking…" : "Verify"}</Text>
                  </PressableScale>
                  <PressableScale onPress={sendCode} hitSlop={8} style={styles.resend} disabled={busy}>
                    <Text style={styles.resendText}>Send a new code</Text>
                  </PressableScale>
                </>
              )}

              {error && <Text style={styles.error}>{error}</Text>}
            </>
          )}
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
  body: { padding: 24, alignItems: "center" },
  badgeHero: { marginTop: 18, marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.inkBrand, textAlign: "center" },
  blurb: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.secondary,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 330,
    marginTop: 10,
    marginBottom: 22,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    alignSelf: "stretch",
    maxWidth: 330,
  },
  ctaText: { color: colors.white, fontFamily: fonts.display, fontSize: 15 },
  codeInput: {
    alignSelf: "stretch",
    maxWidth: 330,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 26,
    letterSpacing: 12,
    textAlign: "center",
    color: colors.inkBrand,
    fontFamily: fonts.display,
    marginBottom: 12,
  },
  resend: { marginTop: 14, padding: 6 },
  resendText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.accentDark },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: "center",
    marginTop: 14,
  },
});
