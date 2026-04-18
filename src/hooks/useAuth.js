/**
 * useAuth.js
 * ─────────────────────────────────────────────────────────────
 * Manages Firebase auth state and the app-level "user" profile object.
 *
 * logout():
 *   • Preserves the "theme" key in localStorage so the user's
 *     preference survives session changes.
 *   • Uses React Router's `useNavigate` instead of
 *     window.location.href for proper SPA navigation (no full reload).
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export function useAuth() {
  const navigate = useNavigate();

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loadingAuth,  setLoadingAuth]  = useState(true);

  // ── Profile stored in localStorage ────────────────────────
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
      setFirebaseUser(fbUser);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  const login = useCallback((userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);

    // Preserve theme preference across logout
    const theme = localStorage.getItem("theme");
    localStorage.clear();
    if (theme) localStorage.setItem("theme", theme);

    navigate("/login", { replace: true });
  }, [navigate]);

  return { firebaseUser, loadingAuth, user, login, logout };
}
