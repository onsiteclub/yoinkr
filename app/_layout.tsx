import { Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from "@expo-google-fonts/figtree";
import { Manrope_700Bold, Manrope_800ExtraBold, useFonts } from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { track } from "@/data/analytics";
import { dropLegacyAnonSession } from "@/data/supabase";
import { colors } from "@/theme/colors";

// No session bootstrap: browsing is sessionless (public reads); a session
// only exists after real login/signup on the welcome screen. Devices that
// used the old anon-first model get their leftover anonymous session dropped.
export default function RootLayout() {
  useEffect(() => {
    void dropLegacyAnonSession();
    track("app_open");
  }, []);

  const [fontsLoaded] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="worker/[id]" />
          <Stack.Screen name="applicants/[id]" />
          <Stack.Screen name="apply/[id]" options={{ presentation: "modal" }} />
          <Stack.Screen name="post" options={{ presentation: "modal" }} />
          <Stack.Screen name="my-ads" />
          <Stack.Screen name="verify" options={{ presentation: "modal" }} />
          <Stack.Screen name="region" options={{ presentation: "modal" }} />
          <Stack.Screen name="setup" options={{ presentation: "modal", gestureEnabled: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
