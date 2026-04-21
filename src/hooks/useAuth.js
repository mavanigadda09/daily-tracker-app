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
 *   • [FIX] deriveName() resolves name from email if displayName absent.
 *   • [FIX] existing docs with name: "" are patched on login silently.
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

/**
 * [NEW] Best-effort name derivation.
 * Priority: Firebase displayName → email local-part → empty string.
 * email/password users never have displayName set, so we fall back
 * to the part before the @ which is always available and readable.
 *
 * Examples:
 *   displayName="Arjun" email="..."         → "Arjun"
 *   displayName=""      email="arjun@..."   → "arjun"
 *   displayName=null    email=null          → ""
 */
function deriveName(fbUser) {
  if (fbUser.displayName?.trim()) return fbUser.displayName.trim();
  if (fbUser.email) return fbUser.email.split("@")[0];
  return "";
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
            const data = snap.data();

            // [FIX] Silently patch existing docs where name was saved as "".
            // This runs once for affected users, then never again because
            // name will be non-empty on the next read.
            if (!data.name?.trim()) {
              const patchedName = deriveName(fbUser);
              await updateDoc(ref, { name: patchedName, updatedAt: serverTimestamp() });
              data.name = patchedName; // mutate local copy so state is consistent
            }

            const firestoreProfile = { uid: fbUser.uid, email: fbUser.email, ...data };
            setUser(firestoreProfile);
            cacheUser(firestoreProfile);
          } else {
            // [FIX] First login — use deriveName() instead of displayName || ""
            const newProfile = {
              uid:       fbUser.uid,
              email:     fbUser.email,
              name:      deriveName(fbUser),   // ← was: fbUser.displayName || ""
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

  // ── login: no-op — onAuthStateChanged is the source of truth ──
  const login = useCallback((_userData) => {}, []);

  // ── updateUser: patch Firestore + local state atomically ───
  const updateUser = useCallback(async (patch) => {
    if (!auth.currentUser) throw new Error("Not authenticated");

    const ref = doc(db, "users", auth.currentUser.uid);
    const sanitized = { ...patch, updatedAt: serverTimestamp() };

    setUser((prev) => {
      const next = { ...prev, ...patch };
      cacheUser(next);
      return next;
    });

    try {
      await updateDoc(ref, sanitized);
    } catch (err) {
      console.error("[useAuth] updateUser failed:", err);
      const ref2 = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref2);
      if (snap.exists()) {
        const rolled = { uid: auth.currentUser.uid, email: auth.currentUser.email, ...snap.data() };
        setUser(rolled);
        cacheUser(rolled);
      }
      throw err;
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
    loadingAuth: isResolvingAuth,
    user,
    setUser,
    login,
    logout,
    updateUser,
  };
}