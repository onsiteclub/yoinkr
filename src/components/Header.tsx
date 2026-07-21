import { router } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsive } from "@/lib/responsive";
import { useSignedIn } from "@/lib/useSignedIn";
import { useRegion } from "@/store/useRegion";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { LogoMark } from "./Logo";
import { PressableScale } from "./PressableScale";

// Screen header (RESPONSIVE-DIRECTIVE §2):
// - mobile: lockup + Ottawa chip + search icon, subtitle below (current design).
// - tablet: brand lives in the nav rail → context line + Ottawa chip + search input.
// - desktop: brand + Ottawa live in the sidebar → context line + search input only.
// Guests get a persistent "Sign in" pill (Kijiji/Marketplace pattern:
// browse-first, the header carries the account entry point).
export function Header({
  subtitle,
  showSearch = true,
}: {
  subtitle?: React.ReactNode;
  showSearch?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { isMobile, isTablet, contentWidth } = useResponsive();
  const city = useRegion((s) => s.city);
  const signedIn = useSignedIn();

  const signInPill = signedIn === false && (
    <PressableScale style={styles.signInPill} onPress={() => router.push("/welcome")}>
      <Text style={styles.signInText}>Sign in</Text>
    </PressableScale>
  );

  if (isMobile) {
    return (
      <View style={{ backgroundColor: colors.surface }}>
        <View style={{ height: insets.top }} />
        <View style={styles.bar}>
          <View style={styles.top}>
            <View style={styles.brand}>
              <LogoMark size={26} />
              <Text style={styles.wordmark}>yoinkr</Text>
              <PressableScale style={styles.chip} onPress={() => router.push("/region")}>
                <Text style={styles.chipText}>{city} ▾</Text>
              </PressableScale>
            </View>
            <View style={styles.rightRow}>
              {signInPill}
              {showSearch && (
                <View style={styles.searchIconBox}>
                  <Text style={styles.searchIcon}>⌕</Text>
                </View>
              )}
            </View>
          </View>
          {subtitle ? <View style={styles.subtitle}>{subtitle}</View> : null}
        </View>
      </View>
    );
  }

  // md+ — brand is in the rail/sidebar; keep context + a real search input.
  return (
    <View style={{ backgroundColor: colors.surface }}>
      <View style={{ height: insets.top }} />
      <View style={styles.bar}>
        <View style={[styles.wideRow, { maxWidth: contentWidth, alignSelf: "flex-start" }]}>
          <View style={{ flex: 1, minWidth: 0 }}>{subtitle ?? null}</View>
          {isTablet && (
            <PressableScale style={styles.chip} onPress={() => router.push("/region")}>
              <Text style={styles.chipText}>{city} ▾</Text>
            </PressableScale>
          )}
          {showSearch && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs, tools, workers…"
              placeholderTextColor={colors.tertiary}
            />
          )}
          {signInPill}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 7 },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 23,
    letterSpacing: -0.5,
    color: colors.inkBrand,
    marginTop: -2,
  },
  chip: {
    backgroundColor: colors.accentTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: colors.accentDark,
    letterSpacing: 0.3,
  },
  rightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  signInPill: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 34,
    justifyContent: "center",
  },
  signInText: { color: colors.white, fontFamily: fonts.bodySemi, fontSize: 12.5 },
  searchIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { color: colors.secondary, fontSize: 17 },
  subtitle: { marginTop: 10 },
  wideRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  searchInput: {
    minHeight: 44,
    width: 260,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: colors.inkBrand,
  },
});
