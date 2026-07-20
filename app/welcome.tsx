import { router } from "expo-router";
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
import Svg, { Path } from "react-native-svg";
import { LogoMark } from "@/components/Logo";
import { PressableScale } from "@/components/PressableScale";
import { requestPasswordReset, signInWithEmail, upgradeToAccount } from "@/data/supabase";
import { useResponsive } from "@/lib/responsive";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

// Landing + login (Facebook-style: brand hero + sign-in card; split panes on
// desktop, single column on mobile). One Onsite account works across the
// whole holding: "Log in" is supabase.auth against onsite-core; "Create
// account" upgrades the anonymous session in place (same user id — guest
// posts and history survive). Apple/Google wait on provider config.
// Form follows login-UX basics: two fields only, correct keyboard/autofill
// hints, show-password toggle, inline errors, no confirm-password.

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
        enter();
      } else {
        await upgradeToAccount(email.trim(), password);
        setNotice("Account created — confirm the link we emailed you. You're in meanwhile.");
        enter();
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

  const comingSoon = () =>
    setNotice("Apple and Google sign-in are coming soon — use email meanwhile.");

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
          One account for every Onsite app. Anything you posted as a guest stays with you.
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

      <PressableScale onPress={comingSoon} style={styles.socialBtn} accessibilityRole="button">
        <AppleMark />
        <Text style={styles.socialText}>Continue with Apple</Text>
      </PressableScale>
      <PressableScale onPress={comingSoon} style={styles.socialBtn} accessibilityRole="button">
        <GoogleMark />
        <Text style={styles.socialText}>Continue with Google</Text>
      </PressableScale>

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

// Brand marks drawn inline (project style: react-native-svg, no icon fonts).
function AppleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill={colors.inkBrand}
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </Svg>
  );
}

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
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

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  socialText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkBrand },
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
