import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        "daily-tracker-app-lilac.vercel.app",  // ← change this
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Google Sign-In ────────────────────────────────────────────────────────
// Native → GoogleAuthPlugin in MainActivity.java
// Web    → signInWithRedirect — avoids all COOP/popup/cross-origin issues
export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    const result = await Capacitor.Plugins.GoogleAuth.signIn();
    const credential = GoogleAuthProvider.credential(result.idToken);
    return signInWithCredential(auth, credential);
  } else {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // Page navigates away — getRedirectResult() handles the return in useAuth
  }
}

// Called once on app mount to capture the result after Google redirects back
export async function consumeRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result; // null if no pending redirect, UserCredential if returning
  } catch (err) {
    console.error('[firebase] getRedirectResult failed:', err);
    return null;
  }
}