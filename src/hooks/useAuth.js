/**
 * useAuth.js
 * ─────────────────────────────────────────────────────────────
 * Manages Firebase auth state and the app-level "user" profile.
 *
 * Key decisions:
 *   • firebaseUser starts as `undefined` (not null) so consumers
 *     can distinguish "still resolving" from "not logged in".
 *     ProtectedRoute uses `isResolvingAuth` for this explicitly.
 *
 *   • isResolvingAuth is a dedicated boolean — cleaner than
 *     checking `firebaseUser === undefined` in every consumer.
 *
 *   • logout() preserves theme key across localStorage.clear()
 *     so the user's appearance preference survives session changes.
 *
 *   • logout() uses useNavigate (SPA nav, no full reload).
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export function useAuth() {
  const navigate = useNavigate();

  // undefined = still resolving | null = not authed | object = authed
  const [firebaseUser,     setFirebaseUser]     = useState(undefined);
  const [isResolvingAuth,  setIsResolvingAuth]  = useState(true);

  // Profile stored in localStorage (display name, goal, focus)
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) ?? null;
    } catch {
      return null;
    }
  });

  // ── Firebase auth listener ─────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser ?? null); // normalize: never leave as undefined after resolve
      setIsResolvingAuth(false);
    });
    return () => unsub();
  }, []);

  // ── Login: persist profile to localStorage ─────────────────
  const login = useCallback((userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── Logout: sign out + preserve theme ─────────────────────
  const logout = useCallback(async () => {
    await signOut(auth);

    const theme = localStorage.getItem("theme");
    localStorage.clear();
    if (theme) localStorage.setItem("theme", theme);

    setUser(null);
    setFirebaseUser(null);

    navigate("/login", { replace: true });
  }, [navigate]);

  return {
    firebaseUser,
    isResolvingAuth,
    // loadingAuth kept as alias so existing consumers don't break
    loadingAuth: isResolvingAuth,
    user,
    setUser,
    login,
    logout,
  };
}