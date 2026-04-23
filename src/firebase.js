import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Diagnostic — confirm env vars are reaching runtime on Vercel
// Remove after auth is confirmed working
console.log('[firebase] authDomain =', firebaseConfig.authDomain);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Google Sign-In ────────────────────────────────────────────────────────
// Native → custom GoogleAuthPlugin in MainActivity.java (signInWithCredential)
// Web    → signInWithPopup (COOP header in vercel.json enables window.opener)
export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    const result = await Capacitor.Plugins.GoogleAuth.signIn();
    const credential = GoogleAuthProvider.credential(result.idToken);
    return signInWithCredential(auth, credential);
  } else {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
    // Returns UserCredential directly — no redirect, no IndexedDB dependency
  }
}

// No-op stub — kept so any existing call sites don't crash during migration.
// Safe to delete once you've confirmed no component calls consumeRedirectResult().
export async function consumeRedirectResult() {
  return null;
}