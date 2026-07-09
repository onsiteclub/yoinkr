import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { PressableScale } from "./PressableScale";

// Custom tab bar matching the mockup: Jobs · Post (elevated center +) ·
// Messages · Profile. The center button routes to the Post modal rather than a
// tab screen.
const ICONS: Record<string, string> = {
  index: "▦",
  messages: "✉",
  profile: "◉",
};
const LABELS: Record<string, string> = {
  index: "Jobs",
  messages: "Messages",
  profile: "Profile",
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => ICONS[r.name]);
  // Render order with the center Post button injected between Jobs and Messages.
  const [jobs, ...rest] = routes;

  const renderTab = (routeName: string, index: number) => {
    const isFocused = state.routes[state.index]?.name === routeName;
    return (
      <PressableScale
        key={routeName}
        style={styles.tab}
        onPress={() => navigation.navigate(routeName)}
      >
        <Text style={[styles.icon, { color: isFocused ? colors.ink : colors.inkLo }]}>
          {ICONS[routeName]}
        </Text>
        <Text style={[styles.label, { color: isFocused ? colors.ink : colors.inkLo }]}>
          {LABELS[routeName]}
        </Text>
      </PressableScale>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {jobs && renderTab(jobs.name, 0)}
      <View style={styles.center}>
        <PressableScale style={styles.postBtn} onPress={() => router.push("/post")}>
          <Text style={styles.postIcon}>＋</Text>
        </PressableScale>
      </View>
      {rest.map((r) => renderTab(r.name, 0))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
  },
  tab: { flex: 1, alignItems: "center", paddingTop: 11, paddingBottom: 7, gap: 3 },
  icon: { fontSize: 19, lineHeight: 22 },
  label: { fontSize: 9.5, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  postBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    marginTop: -14,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  postIcon: { color: colors.white, fontSize: 30, fontWeight: "300", lineHeight: 34 },
});
