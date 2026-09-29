import { useEffect, useState } from "react";

/**
 * Signed-in user for public pages ({ loading, user }). user is null when signed out.
 * Pass { enabled: false } when a parent already provides the session.
 */
export function useCurrentUser({ enabled = true } = {}) {
  const [state, setState] = useState({ loading: enabled, user: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setState({ loading: false, user: data?.user || null });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
