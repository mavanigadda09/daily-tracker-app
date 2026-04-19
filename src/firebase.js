import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─── Config ───────────────────────────────────────────────────
// Values come from .env — never hardcode secrets in source.
// All VITE_ prefixed vars are injected at build time by Vite.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ─── Init (safe — prevents duplicate instances) ───────────────
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ─── Services ─────────────────────────────────────────────────
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Auth helpers ─────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google popup.
 * Returns { success, user } or { success: false, error }.
 * Callers should use useAuth().login() — not this directly.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("[Firebase] Google sign-in failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out.
 * Prefer useAuth().logout() which also clears localStorage + navigates.
 * This export exists for edge cases (e.g. forced logout from cloud.js).
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("[Firebase] Logout failed:", error);
    return { success: false, error: error.message };
  }
};