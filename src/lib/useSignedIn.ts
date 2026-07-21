import { useEffect, useState } from "react";
import { supabase } from "@/data/supabase";

// Reactive "is someone signed in" for UI affordances (header pill, tab gates).
// null while resolving, then live-updates on login/logout.
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    // Legacy anonymous sessions don't count as accounts.
    const real = (session: { user: { is_anonymous?: boolean } } | null) =>
      !!session && !session.user.is_anonymous;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSignedIn(real(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSignedIn(real(session));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return signedIn;
}
