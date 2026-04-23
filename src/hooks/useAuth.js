import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
  try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData)); }
  catch { /* storage full — non-fatal */ }
}

export function useAuth() {
  const navigate = useNavigate();

  const [firebaseUser,    setFirebaseUser]    = useState(undefined);
  const [isResolvingAuth, setIsResolvingAuth] = useState(true);
  const [user,            setUser]            = useState(getCachedUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser ?? null);

      if (fbUser) {
        try {
          const ref  = doc(db, "users", fbUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();

            // Patch missing name
            if (!data.name?.trim()) {
              const patchedName = deriveName(fbUser);
              try {
                await setDoc(ref, { name: patchedName, updatedAt: serverTimestamp() }, { merge: true });
              } catch (patchErr) {
                console.error("[useAuth] name patch failed:", patchErr);
              }
              data.name = patchedName;
            }

            const firestoreProfile = { uid: fbUser.uid, email: fbUser.email, ...data };
            setUser(firestoreProfile);
            cacheUser(firestoreProfile);

            // Returning user — check onboarding status
            if (!data.onboardingComplete) {
              navigate("/onboarding", { replace: true });
            }

          } else {
            // Brand new user — create doc, send to onboarding
            const newProfile = {
              uid:                fbUser.uid,
              email:              fbUser.email,
              name:               deriveName(fbUser),
              goal:               "",
              focus:              "productivity",
              onboardingComplete: false,
              emberPoints:        0,
              level:              1,
              identityTier:       "Ash",
              primaryDomain:      null,
              createdAt:          serverTimestamp(),
            };
            await setDoc(ref, newProfile);
            setUser(newProfile);
            cacheUser(newProfile);
            navigate("/onboarding", { replace: true });
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
  }, [navigate]);

  const login = useCallback((_userData) => {}, []);

  const updateUser = useCallback(async (patch) => {
    if (!auth.currentUser) throw new Error("Not authenticated");

    const ref = doc(db, "users", auth.currentUser.uid);

    setUser((prev) => {
      const next = { ...prev, ...patch };
      cacheUser(next);
      return next;
    });

    try {
      await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error("[useAuth] updateUser failed:", err);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const rolled = { uid: auth.currentUser.uid, email: auth.currentUser.email, ...snap.data() };
        setUser(rolled);
        cacheUser(rolled);
      }
      throw err;
    }
  }, []);

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