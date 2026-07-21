import { Tabs } from "expo-router";
import { View } from "react-native";
import { NavRail, Sidebar } from "@/components/SideNav";
import { TabBar } from "@/components/TabBar";
import { useResponsive } from "@/lib/responsive";

// Opening the app NEVER interrupts: no welcome screen, no setup form —
// straight to the feed (marketplace pattern: browse first). Profile setup
// appears exactly once, right after signup (see welcome.tsx); editing later
// lives on the Profile tab.
export default function TabsLayout() {
  const { mode, isMobile } = useResponsive();

  // AppShell (RESPONSIVE-DIRECTIVE §2): component swap, not resize —
  // bottom tabs (mobile) → nav rail (tablet) → sidebar (desktop).
  const tabs = (
    <Tabs
      tabBar={isMobile ? (props) => <TabBar {...props} /> : () => null}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Jobs" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );

  if (isMobile) return tabs;

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {mode === "tablet" ? <NavRail /> : <Sidebar />}
      <View style={{ flex: 1 }}>{tabs}</View>
    </View>
  );
}
