import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
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
import { track } from "@/data/analytics";
import { requestPasswordReset, signInWithEmail, signUpWithEmail } from "@/data/supabase";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Landing + login (Facebook-style: brand hero + sign-in card; split panes on
// desktop, single column on mobile). Tester-phase model: browsing is free
// and sessionless; interacting requires an account. One Onsite account works
// across the whole holding. Autoconfirm is on, so signup enters instantly.
// Guests land here with ?gate=1 when they tap an interaction.
// Form follows login-UX basics: two fields only, correct keyboard/autofill
// hints, show-password toggle, inline errors, no confirm-password.

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { gate } = useLocalSearchParams<{ gate?: string }>();

  // Arriving via an interaction gate → lead with signup and say why.
  const [mode, setMode] = useState<"login" | "signup">(gate ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    gate ? "Browsing is free — posting, yoinking and messaging need a free account." : null
  );
  const passwordRef = useRef<TextInput>(null);

  const enter = () => router.replace("/(tabs)");

  const validate = (): boolean => {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setError(mode === "login" ? "Enter your password." : "Password needs at least 6 characters.");
      return false;
    }
    setError(null);
    return true;
  };

  const submit = async () => {
    if (!validate() || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "login") {
        await signInWithEmail(email.trim(), password);
        track("login", { gated: !!gate });
        enter();
      } else {
        await signUpWithEmail(email.trim(), password);
        track("signup", { gated: !!gate });
        // Fresh account → profile setup once, right now (skippable "Later").
        enter();
        router.push("/setup");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        /invalid login credentials/i.test(msg)
          ? "Wrong email or password."
          : /already.*registered|already.*exists/i.test(msg)
            ? "This email already has an account — log in instead."
            : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Type your email above first, then tap this.");
      return;
    }
    setError(null);
    await requestPasswordReset(email.trim());
    setNotice("Password reset link sent — check your inbox.");
  };

  const hero = (
    <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
      <View style={styles.lockup}>
        <LogoMark size={isDesktop ? 64 : 48} />
        <Text style={[styles.wordmark, isDesktop && { fontSize: 56 }]}>yoinkr</Text>
      </View>
      <Text style={[styles.tagline, isDesktop && { fontSize: 22, maxWidth: 380 }]}>
        Grab work · Lend a hand
      </Text>
      <Text style={[styles.blurb, isDesktop && { fontSize: 15, maxWidth: 400 }]}>
        Jobs, workers and tools for construction crews — post work, find hands,
        build your reputation.
      </Text>
      <View style={styles.geoPill}>
        <Text style={styles.geoText}>Ottawa only — for now</Text>
      </View>
    </View>
  );

  const card = (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{mode === "login" ? "Log in" : "Create account"}</Text>
      {mode === "signup" && (
        <Text style={styles.modeHint}>
          Free, instant, one account for every Onsite app.
        </Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.tertiary}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (error) setError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <View style={styles.passwordRow}>
        <TextInput
          ref={passwordRef}
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          placeholderTextColor={colors.tertiary}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError(null);
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          textContentType={mode === "login" ? "password" : "newPassword"}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <PressableScale
          onPress={() => setShowPassword((s) => !s)}
          hitSlop={10}
          style={styles.showToggle}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          <Text style={styles.showToggleText}>{showPassword ? "Hide" : "Show"}</Text>
        </PressableScale>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <PressableScale
        onPress={submit}
        style={[styles.cta, busy && { opacity: 0.6 }]}
        disabled={busy}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>
          {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
        </Text>
      </PressableScale>

      {mode === "login" && (
        <PressableScale onPress={forgotPassword} hitSlop={8} style={styles.forgot}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </PressableScale>
      )}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Apple/Google removed 2026-07-22 (founder): OAuth isn't wired yet —
          no dead buttons on the door. Bring them back with real providers. */}
      <PressableScale onPress={enter} style={styles.guestBtn} accessibilityRole="button">
        <Text style={styles.guestText}>Continue as guest</Text>
      </PressableScale>

      {notice && <Text style={styles.notice}>{notice}</Text>}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {mode === "login" ? "New to yoinkr? " : "Already have an account? "}
        </Text>
        <PressableScale
          onPress={() => {
            setMode((m) => (m === "login" ? "signup" : "login"));
            setError(null);
            setNotice(null);
          }}
          hitSlop={8}
        >
          <Text style={[styles.linkText, { fontFamily: fonts.bodyBold }]}>
            {mode === "login" ? "Create account" : "Log in"}
          </Text>
        </PressableScale>
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.split}>
        <View style={styles.splitLeft}>
          <View style={{ width: "100%", maxWidth: 440 }}>{hero}</View>
        </View>
        <View style={styles.splitRight}>
          <View style={{ width: "100%", maxWidth: 420 }}>{card}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {hero}
          <View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>{card}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.warmPaper },
  body: { padding: 24, flexGrow: 1, justifyContent: "center" },

  // Desktop: Facebook-style split — brand pane left, sign-in pane right.
  split: { flex: 1, flexDirection: "row" },
  // Each pane pulls its content toward the center line so the lockup and the
  // card sit close together on wide screens instead of hugging the viewport
  // edges (the gap between them stays a fixed 2 × 56px).
  splitLeft: {
    flex: 1,
    backgroundColor: colors.warmPaper,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 56,
  },
  splitRight: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 56,
    paddingVertical: 32,
  },

  hero: { alignItems: "center", paddingVertical: 28 },
  heroDesktop: { alignItems: "flex-start", paddingVertical: 0 },
  lockup: { flexDirection: "row", alignItems: "center", gap: 10 },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -1,
    color: colors.inkBrand,
  },
  tagline: {
    fontFamily: fonts.displaySub,
    fontSize: 17,
    color: colors.inkBrand,
    marginTop: 12,
  },
  blurb: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondary,
    textAlign: "center",
    maxWidth: 300,
    marginTop: 8,
  },
  geoPill: {
    marginTop: 14,
    backgroundColor: colors.accentTint,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  geoText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.accentDark },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.inkBrand,
    marginBottom: 14,
  },
  modeHint: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.secondary,
    lineHeight: 17,
    marginTop: -8,
    marginBottom: 12,
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
    marginBottom: 10,
  },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 60 },
  showToggle: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 10,
    justifyContent: "center",
  },
  showToggleText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.secondary },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.danger, marginBottom: 8 },

  cta: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  ctaText: { color: colors.white, fontFamily: fonts.display, fontSize: 15.5 },
  forgot: { alignSelf: "center", marginTop: 12, padding: 4 },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.accentDark },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.tertiary },

  guestBtn: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: colors.accentTint,
  },
  guestText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.accentDark },
  notice: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.secondary,
    textAlign: "center",
    marginTop: 10,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  footerText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.secondary },
});
