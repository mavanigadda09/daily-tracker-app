import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, signInWithGoogle } from "../firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const USER_CACHE_KEY = "user";

function deriveName(fbUser) {
  if (fbUser.displayName?.trim()) return fbUser.displayName.trim();
  if (fbUser.email) return fbUser.email.split("@")[0];
  return "";
}

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
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
  } catch {}
}

export function useAuth() {
  const navigate = useNavigate();

  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [isResolvingAuth, setIsResolvingAuth] = useState(true);
  const [user, setUser] = useState(getCachedUser);

  // ── Email login ───────────────────────────────────────────
  const signInWithEmail = useCallback(async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  }, []);

  // ── Google login ──────────────────────────────────────────
  // On native Android: uses @codetrix-studio/capacitor-google-auth plugin
  // On web: uses signInWithPopup
  // NO redirect flow — redirect causes localhost ERR_CONNECTION_REFUSED on Android WebView
  const signInWithGoogleAuth = useCallback(async () => {
    return await signInWithGoogle();
  }, []);

  // ── Auth state listener ───────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser ?? null);

      if (fbUser) {
        try {
          const ref  = doc(db, "users", fbUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();

            if (!data.name?.trim()) {
              const patchedName = deriveName(fbUser);
              await setDoc(ref, { name: patchedName }, { merge: true });
              data.name = patchedName;
            }

            const profile = { uid: fbUser.uid, email: fbUser.email, ...data };
            setUser(profile);
            cacheUser(profile);

            if (!data.onboardingComplete) {
              navigate("/onboarding", { replace: true });
            }

          } else {
            const newProfile = {
              uid:                fbUser.uid,
              email:              fbUser.email,
              name:               deriveName(fbUser),
              onboardingComplete: false,
              emberPoints:        0,
              level:              1,
              identityTier:       "Ash",
              createdAt:          serverTimestamp(),
            };
            await setDoc(ref, newProfile);
            setUser(newProfile);
            cacheUser(newProfile);
            navigate("/onboarding", { replace: true });
          }

        } catch (err) {
          console.error("[useAuth] Firestore error:", err);
        }
      } else {
        setUser(null);
      }

      setIsResolvingAuth(false);
    });

    return () => unsub();
  }, [navigate]);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/login", { replace: true });
  }, [navigate]);

  // ── Update user profile ───────────────────────────────────
  const updateUser = useCallback(async (payload) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error("No authenticated user");

    const ref = doc(db, "users", fbUser.uid);
    const cleanPayload = { ...payload };
    await updateDoc(ref, cleanPayload);

    setUser(prev => {
      const updated = { ...prev, ...cleanPayload };
      cacheUser(updated);
      return updated;
    });
  }, []);

  return {
    firebaseUser,
    isResolvingAuth,
    user,
    setUser,
    logout,
    updateUser,
    signInWithEmail,
    signInWithGoogleAuth,
  };
} 