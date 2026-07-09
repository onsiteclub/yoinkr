import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // AsyncStorage on native; the default (localStorage) on web.
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// v1 auth: anonymous session on first use, upgradeable to email/Apple/Google
// later (supabase.auth.updateUser / linkIdentity keeps the same user id, so
// profile, listings and trust history survive the upgrade).
let sessionPromise: Promise<string> | null = null;

export function ensureUserId(): Promise<string> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { data } = await supabase.auth.getSession();
      let user = data.session?.user;
      if (!user) {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        user = anon.user ?? undefined;
      }
      if (!user) throw new Error("Could not establish a session");
      // Make sure the profile row exists (no-op when it already does).
      await supabase
        .from("profiles")
        .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
      return user.id;
    })().catch((e) => {
      sessionPromise = null; // allow retry on failure
      throw e;
    });
  }
  return sessionPromise;
}

// Best-effort current user id without forcing a sign-in (null when signed out).
export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
