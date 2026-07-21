import { Tabs, router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { NavRail, Sidebar } from "@/components/SideNav";
import { TabBar } from "@/components/TabBar";
import { getMyProfile, isProfileIncomplete } from "@/data/repository";
import { hasAccount } from "@/data/supabase";
import { useResponsive } from "@/lib/responsive";

// First access lands straight on the feed — no welcome screen, no forms
// (marketplace pattern: browse first; the account only appears when the
// person tries to interact). The one prompt left: someone SIGNED IN with an
// unfinished profile gets the setup modal once per session — skippable
// ("Later"); browsing never blocks.
let promptedThisSession = false;

export default function TabsLayout() {
  const { mode, isMobile } = useResponsive();

  useEffect(() => {
    if (promptedThisSession) return;
    promptedThisSession = true;
    hasAccount().then((ok) => {
      if (!ok) {
        promptedThisSession = false; // guest — check again once they sign in
        return;
      }
      getMyProfile()
        .then((me) => {
          if (isProfileIncomplete(me)) router.push("/setup");
        })
        .catch(() => {
          promptedThisSession = false; // network hiccup — allow a retry next mount
        });
    });
  }, []);

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
