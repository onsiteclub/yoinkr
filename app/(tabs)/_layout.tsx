import { Redirect, Tabs, router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { NavRail, Sidebar } from "@/components/SideNav";
import { TabBar } from "@/components/TabBar";
import { getMyProfile, isProfileIncomplete } from "@/data/repository";
import { useResponsive } from "@/lib/responsive";

// Show the welcome/login page once per app session before anything else
// (real auth will replace this with a "logged out → welcome" check), then
// prompt the profile setup when the user is still the anonymous default
// ("New worker", no trade). Browsing works without it; setup has "Later".
let welcomedThisSession = false;
let promptedThisSession = false;

export default function TabsLayout() {
  const { mode, isMobile } = useResponsive();
  const redirectToWelcome = !welcomedThisSession;

  useEffect(() => {
    if (redirectToWelcome) {
      welcomedThisSession = true;
      return;
    }
    if (promptedThisSession) return;
    promptedThisSession = true;
    getMyProfile()
      .then((me) => {
        if (isProfileIncomplete(me)) router.push("/setup");
      })
      .catch(() => {
        promptedThisSession = false; // network hiccup — allow a retry next mount
      });
  }, [redirectToWelcome]);

  if (redirectToWelcome) return <Redirect href="/welcome" />;

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
