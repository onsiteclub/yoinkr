import { router, usePathname } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRegion } from "@/store/useRegion";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { SidebarFilters } from "./FeedFilters";
import { LogoMark } from "./Logo";
import { PressableScale } from "./PressableScale";

// Tablet nav rail (72px) and desktop sidebar (240px) — the bottom tab bar is
// mobile-only (RESPONSIVE-DIRECTIVE.md §2). Same routes, different chrome.

const ITEMS = [
  { path: "/", icon: "▦", label: "Jobs" },
  { path: "/messages", icon: "✉", label: "Messages" },
  { path: "/profile", icon: "◉", label: "Profile" },
] as const;

function useActivePath(): string {
  const pathname = usePathname();
  return pathname === "" ? "/" : pathname;
}

function goTo(path: (typeof ITEMS)[number]["path"]) {
  // Tab routes — replace so rail/sidebar behave like tabs, not a stack.
  router.replace(path as never);
}

export function NavRail() {
  const insets = useSafeAreaInsets();
  const active = useActivePath();
  return (
    <View style={[railStyles.rail, { paddingTop: insets.top + 16 }]}>
      <LogoMark size={30} />
      <PressableScale style={railStyles.post} onPress={() => router.push("/post")}>
        <Text style={railStyles.postIcon}>＋</Text>
      </PressableScale>
      <View style={{ gap: 6 }}>
        {ITEMS.map((it) => {
          const isActive = active === it.path;
          return (
            <PressableScale
              key={it.path}
              style={[railStyles.item, isActive && railStyles.itemActive]}
              onPress={() => goTo(it.path)}
            >
              <Text style={[railStyles.icon, { color: isActive ? colors.accentDark : colors.secondary }]}>
                {it.icon}
              </Text>
              <Text style={[railStyles.label, { color: isActive ? colors.accentDark : colors.secondary }]}>
                {it.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

export function Sidebar() {
  const insets = useSafeAreaInsets();
  const active = useActivePath();
  const city = useRegion((s) => s.city);
  return (
    <View style={[sideStyles.side, { paddingTop: insets.top + 20 }]}>
      <View style={sideStyles.lockup}>
        <LogoMark size={30} />
        <Text style={sideStyles.wordmark}>yoinkr</Text>
      </View>

      {/* Both sides post: a job you're hiring for, or yourself for work. */}
      <PressableScale style={sideStyles.post} onPress={() => router.push("/post")}>
        <Text style={sideStyles.postText}>＋ Post — job or yourself</Text>
      </PressableScale>

      {/* Nav + contextual filters scroll together on short windows. */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 4, marginTop: 18 }}>
          {ITEMS.map((it) => {
            const isActive = active === it.path;
            return (
              <PressableScale
                key={it.path}
                style={[sideStyles.item, isActive && sideStyles.itemActive]}
                onPress={() => goTo(it.path)}
              >
                <Text style={[sideStyles.icon, { color: isActive ? colors.accentDark : colors.secondary }]}>
                  {it.icon}
                </Text>
                <Text
                  style={[
                    sideStyles.label,
                    { color: isActive ? colors.accentDark : colors.inkBrand },
                    isActive && { fontFamily: fonts.bodyBold },
                  ]}
                >
                  {it.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {/* Feed filters — only meaningful on the Jobs feed (FB Marketplace
            pattern: category/trade lists live in the left column). */}
        {active === "/" && <SidebarFilters />}
      </ScrollView>

      <PressableScale style={sideStyles.region} onPress={() => router.push("/region")}>
        <Text style={sideStyles.regionText}>📍 {city}</Text>
        <Text style={sideStyles.regionHint}>Ottawa only — for now ▾</Text>
      </PressableScale>
    </View>
  );
}

const railStyles = StyleSheet.create({
  rail: {
    width: 72,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: "center",
    gap: 18,
    paddingBottom: 16,
  },
  post: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  postIcon: { color: colors.white, fontSize: 26, fontWeight: "300", lineHeight: 30 },
  item: {
    width: 60,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 2,
  },
  itemActive: { backgroundColor: colors.accentTint },
  icon: { fontSize: 18, lineHeight: 21 },
  label: { fontSize: 9, fontFamily: fonts.bodySemi },
});

const sideStyles = StyleSheet.create({
  side: {
    width: 240,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  lockup: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.inkBrand,
    marginTop: -2,
  },
  post: {
    marginTop: 20,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  postText: { color: colors.white, fontFamily: fonts.display, fontSize: 14 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  itemActive: { backgroundColor: colors.accentTint },
  icon: { fontSize: 17, width: 22 },
  label: { fontSize: 14, fontFamily: fonts.bodySemi },
  region: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  regionText: { fontSize: 13.5, fontFamily: fonts.bodyBold, color: colors.inkBrand },
  regionHint: { fontSize: 11, color: colors.tertiary, marginTop: 2 },
});
