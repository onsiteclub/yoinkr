// Product analytics → analytics.events on onsite-core (source app "yoinkr").
// Fire-and-forget writes only: RLS gives the client INSERT and nothing else;
// reading happens in the SQL editor as the founder. What we log and why —
// including the tester-phase retention/purge plan — is documented in
// TESTING.md at the repo root.
import { Platform } from "react-native";
import { supabase } from "./supabase";

// One id per app launch, so funnels can group a session without any device
// fingerprinting — the id lives and dies with the JS context.
const sessionId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function track(event: string, metadata: Record<string, unknown> = {}): void {
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      await supabase
        .schema("analytics")
        .from("events")
        .insert({
          app: "yoinkr",
          event,
          user_id: data.session?.user.id ?? null,
          metadata: { ...metadata, session: sessionId, platform: Platform.OS },
        });
    } catch {
      // Analytics must never break the app — drop the event and move on.
    }
  })();
}
