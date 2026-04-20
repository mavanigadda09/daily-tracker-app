/**
 * useAuth.js
 * ─────────────────────────────────────────────────────────────
 * Manages Firebase auth state and the app-level "user" profile.
 *
 * Changes from previous version:
 *   • user profile is now sourced from Firestore (users/{uid} doc)
 *     with localStorage as a cache/fallback for instant first paint.
 *   • updateUser() writes a patch to Firestore + updates local state
 *     atomically so Profile saves actually persist across sessions.
 *   • firebaseUser listener now bootstraps the Firestore user doc
 *     on first login if it doesn't exist yet.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const USER_CACHE_KEY = "user";

function getCachedUser() {
  try { return JSON.parse(localStorage.getItem(USER_CACHE_KEY)) ?? null; }
  catch { return null; }
}

function cacheUser(userData) {
  try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData)); }
  catch { /* storage full — non-fatal */ }
}

export function useAuth() {
  const navigate = useNavigate();

  const [firebaseUser,    setFirebaseUser]    = useState(undefined);
  const [isResolvingAuth, setIsResolvingAuth] = useState(true);

  // Seed from cache for instant paint; Firestore will overwrite shortly after.
  const [user, setUser] = useState(getCachedUser);

  // ── Auth listener + Firestore user doc bootstrap ───────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser ?? null);

      if (fbUser) {
        try {
          const ref  = doc(db, "users", fbUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            // Merge Firestore data with firebase auth fields
            const firestoreProfile = { uid: fbUser.uid, email: fbUser.email, ...snap.data() };
            setUser(firestoreProfile);
            cacheUser(firestoreProfile);
          } else {
            // First login — create the user doc
            const newProfile = {
              uid:       fbUser.uid,
              email:     fbUser.email,
              name:      fbUser.displayName || "",
              goal:      "",
              focus:     "productivity",
              createdAt: serverTimestamp(),
            };
            await setDoc(ref, newProfile);
            setUser(newProfile);
            cacheUser(newProfile);
          }
        } catch (err) {
          console.error("[useAuth] Firestore user fetch failed:", err);
          // Fall back to cache — app remains usable offline
          const cached = getCachedUser();
          if (cached) setUser(cached);
        }
      } else {
        setUser(null);
      }

      setIsResolvingAuth(false);
    });

    return () => unsub();
  }, []);

  // ── login: called from Login.jsx after signInWithEmailAndPassword ──
  // Firebase auth listener above handles the actual profile load.
  // This is kept for API compatibility — callers pass userData
  // but we ignore it now; the listener is the source of truth.
  const login = useCallback((_userData) => {
    // No-op: onAuthStateChanged fires immediately after sign-in
    // and bootstraps the profile from Firestore.
  }, []);

  // ── updateUser: patch Firestore + local state atomically ───
  const updateUser = useCallback(async (patch) => {
    if (!auth.currentUser) throw new Error("Not authenticated");

    const ref = doc(db, "users", auth.currentUser.uid);
    const sanitized = { ...patch, updatedAt: serverTimestamp() };

    // Optimistic local update first so UI feels instant
    setUser((prev) => {
      const next = { ...prev, ...patch };
      cacheUser(next);
      return next;
    });

    try {
      await updateDoc(ref, sanitized);
    } catch (err) {
      // Roll back local state if Firestore write fails
      console.error("[useAuth] updateUser failed:", err);
      const ref2   = doc(db, "users", auth.currentUser.uid);
      const snap   = await getDoc(ref2);
      if (snap.exists()) {
        const rolled = { uid: auth.currentUser.uid, email: auth.currentUser.email, ...snap.data() };
        setUser(rolled);
        cacheUser(rolled);
      }
      throw err; // re-throw so useProfileEditor can show saveError
    }
  }, []);

  // ── logout ─────────────────────────────────────────────────
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
    loadingAuth: isResolvingAuth, // alias — keeps existing consumers working
    user,
    setUser,
    login,
    logout,
    updateUser,
  };
}