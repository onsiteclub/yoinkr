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

// Tester-phase auth model (2026-07-20): browsing is sessionless — the feed,
// listings, profiles, references and vouches are public reads under the anon
// key. Interacting (post, yoink, message, vouch, rate) requires a real
// Onsite account; there is NO automatic anonymous session anymore. UI entry
// points gate with requireAccount() (src/lib/gate.ts); ensureUserId is the
// data-layer backstop and throws when no one is signed in.
let sessionPromise: Promise<string> | null = null;

// Login/logout must invalidate the cached session — otherwise the app keeps
// acting as the pre-login user id.
supabase.auth.onAuthStateChange(() => {
  sessionPromise = null;
});

export function ensureUserId(): Promise<string> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) throw new Error("Create a free account to do that — browsing needs none.");
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

// True when someone is signed in — the "may interact" check.
export async function hasAccount(): Promise<boolean> {
  return (await currentUserId()) != null;
}

// Existing account, any Onsite app. Replaces whatever session was active.
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// Autoconfirm is on for the tester phase, so signUp returns a live session
// immediately — no email round-trip. The profile row is created here so the
// person can interact right away.
export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.session || !data.user) {
    // Only happens if email confirmation gets re-enabled on the project.
    throw new Error("Account created — confirm the email we sent you, then log in.");
  }
  await supabase
    .from("profiles")
    .upsert({ id: data.user.id }, { onConflict: "id", ignoreDuplicates: true });
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
