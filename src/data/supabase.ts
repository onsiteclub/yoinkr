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
  // All Yoinkr tables live in the `yoinkr` schema on onsite-core; `public` is
  // empty by holding-wide rule. The schema must be listed under the project's
  // "Exposed schemas" or every query fails with PGRST106.
  db: { schema: "yoinkr" },
  auth: {
    // AsyncStorage on native; the default (localStorage) on web.
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// v1 auth: anonymous session on first use, upgradeable to a real Onsite
// account (updateUser keeps the same user id, so profile, listings and trust
// history survive the upgrade). Email/password is wired on the welcome
// screen; Apple/Google wait for provider config on onsite-core.
let sessionPromise: Promise<string> | null = null;

// Login/logout/upgrade must invalidate the cached session — otherwise the
// app keeps acting as the pre-login (anonymous) user id.
supabase.auth.onAuthStateChange(() => {
  sessionPromise = null;
});

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

// ---- real accounts (one Onsite account across the whole holding) ----

// Existing account, any Onsite app. Replaces whatever session was active.
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// Create account = attach email+password to the CURRENT (anonymous) session.
// Same user id before and after, so everything posted as a guest is kept.
// onsite-core requires email confirmation — the session stays usable
// meanwhile; the emailed link is what makes login work from other devices.
export async function upgradeToAccount(email: string, password: string): Promise<void> {
  await ensureUserId(); // make sure the anon session that owns the data exists
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
