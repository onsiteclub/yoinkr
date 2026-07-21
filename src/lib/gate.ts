import { router } from "expo-router";
import { hasAccount } from "@/data/supabase";

// Interaction gate: browsing never needs an account, interacting always does.
// Call before any write-path navigation/action; when the person is a guest it
// sends them to the welcome screen (with the "why" notice) and returns false
// so the caller bails.
export async function requireAccount(): Promise<boolean> {
  if (await hasAccount()) return true;
  router.push({ pathname: "/welcome", params: { gate: "1" } });
  return false;
}
