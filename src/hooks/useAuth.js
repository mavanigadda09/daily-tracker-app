/**
 * useAuth.js
 * ─────────────────────────────────────────────────────────────
 * Manages Firebase auth state and the app-level "user" profile.
 *
 * Changes:
 *   • deriveName() resolves name from email prefix if displayName absent
 *   • getCachedUser() evicts stale cache entries where name is blank/missing
 *   • existing Firestore docs with name:"" are silently patched on login
 *   • silent patch now uses setDoc+merge (more permissive than updateDoc)
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const USER_CACHE_KEY = "user";

/**
 * Best-effort name derivation.
 * Priority: Firebase displayName → email local-part → ""
 * email/password users never have displayName set, so we fall back
 * to the part before @ which is always available and human-readable.
 */
function deriveName(fbUser) {
  if (fbUser.displayName?.trim()) return fbUser.displayName.trim();
  if (fbUser.email) return fbUser.email.split("@")[0];
  return "";
}

/**
 * Evict poisoned cache entries where name is missing, null, empty,
 * or whitespace-only — so stale data never seeds initial state.
 * Firestore will re-populate with deriveName() on mount.
 */
function getCachedUser() {
  try {
    const cached = JSON.parse(localStorage.getItem(USER_CACHE_KEY)) ?? null;
    if (cached && !cached.name?.trim()) {
      localStorage.removeItem(USER_CACHE_KEY);
      return null;
    }
    return cached;
  } catch {
    return null;
  }
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
            const data = snap.data();

            // Silently patch existing docs where name is missing or blank.
            // Uses setDoc+merge — more permissive than updateDoc under
            // strict Firestore rules, and safe to call even if field exists.
            // Runs once per affected user — skipped forever once name is set.
            if (!data.name?.trim()) {
              const patchedName = deriveName(fbUser);
              try {
                await setDoc(
                  ref,
                  { name: patchedName, updatedAt: serverTimestamp() },
                  { merge: true }
                );
              } catch (patchErr) {
                console.error("[useAuth] name patch failed:", patchErr);
                // Non-fatal — carry on with derived name in local state
              }
              data.name = patchedName;
            }

            const firestoreProfile = { uid: fbUser.uid, email: fbUser.email, ...data };
            setUser(firestoreProfile);
            cacheUser(firestoreProfile);

          } else {
            // First login — derive name instead of relying on displayName
            const newProfile = {
              uid:       fbUser.uid,
              email:     fbUser.email,
              name:      deriveName(fbUser),
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

  // No-op — onAuthStateChanged is the source of truth
  const login = useCallback((_userData) => {}, []);

  // ── updateUser: patch Firestore + local state atomically ───
  const updateUser = useCallback(async (patch) => {
    if (!auth.currentUser) throw new Error("Not authenticated");

    const ref = doc(db, "users", auth.currentUser.uid);

    // Optimistic local update first so UI feels instant
    setUser((prev) => {
      const next = { ...prev, ...patch };
      cacheUser(next);
      return next;
    });

    try {
      // setDoc+merge is safer than updateDoc — works even if fields
      // don't exist yet, and respects Firestore rules more broadly
      await setDoc(
        ref,
        { ...patch, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      console.error("[useAuth] updateUser failed:", err);
      // Roll back local state from Firestore
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const rolled = { uid: auth.currentUser.uid, email: auth.currentUser.email, ...snap.data() };
        setUser(rolled);
        cacheUser(rolled);
      }
      throw err; // re-throw so Profile can show saveError
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