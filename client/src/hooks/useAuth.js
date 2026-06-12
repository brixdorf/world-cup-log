import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    // 5-second fallback: if /me never resolves (server down/slow), unblock the UI
    const fallback = setTimeout(() => {
      if (active) {
        setIsLoggedIn(false);
        setChecking(false);
      }
    }, 5000);

    api
      .me()
      .then((data) => {
        if (active) setIsLoggedIn(data.authenticated);
      })
      .catch(() => {
        if (active) setIsLoggedIn(false);
      })
      .finally(() => {
        if (active) {
          clearTimeout(fallback);
          setChecking(false);
        }
      });

    return () => {
      active = false;
      clearTimeout(fallback);
    };
  }, []);

  // Stable references — safe to use in effect deps of child components
  const login = useCallback(async (username, password) => {
    await api.login(username, password);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    setIsLoggedIn(false); // clear local state immediately — never block the UI on server response
    try {
      await api.logout();
    } catch {
      /* cookie clear failed server-side; local state already cleared */
    }
  }, []);

  return { isLoggedIn, checking, login, logout };
}
