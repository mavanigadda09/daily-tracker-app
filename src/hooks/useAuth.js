import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const USER_CACHE_KEY = "user";
const provider = new GoogleAuthProvider();

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
  try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData)); }
  catch {}
}

export function useAuth() {
  const navigate = useNavigate();

  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [isResolvingAuth, setIsResolvingAuth] = useState(true);
  const [user, setUser] = useState(getCachedUser);

  // 🔥 EMAIL LOGIN (FIX)
  const signInWithEmail = useCallback(async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  }, []);

  // 🔥 GOOGLE LOGIN (FIX)
  const signInWithGoogleAuth = useCallback(async () => {
    return await signInWithPopup(auth, provider);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser ?? null);

      if (fbUser) {
        try {
          const ref = doc(db, "users", fbUser.uid);
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
              uid: fbUser.uid,
              email: fbUser.email,
              name: deriveName(fbUser),
              onboardingComplete: false,
              emberPoints: 0,
              level: 1,
              identityTier: "Ash",
              createdAt: serverTimestamp(),
            };

            await setDoc(ref, newProfile);
            setUser(newProfile);
            cacheUser(newProfile);
            navigate("/onboarding", { replace: true });
          }

        } catch (err) {
          console.error("[useAuth]", err);
        }
      } else {
        setUser(null);
      }

      setIsResolvingAuth(false);
    });

    return () => unsub();
  }, [navigate]);

  const logout = useCallback(async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/login", { replace: true });
  }, [navigate]);

  return {
    firebaseUser,
    isResolvingAuth,
    user,
    setUser,
    logout,

    // ✅ EXPORT THESE (CRITICAL)
    signInWithEmail,
    signInWithGoogleAuth,
  };
}