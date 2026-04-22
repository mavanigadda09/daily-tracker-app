import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';

// ─── Firebase project config ───────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─── Core exports ──────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Google Sign-In ────────────────────────────────────────────────────────
// Native path  → GoogleAuthPlugin registered in MainActivity.java (no npm plugin needed)
// Web path     → standard Firebase popup (Vercel / browser)
export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('[GoogleAuth] calling native signIn...');
      const result = await Capacitor.Plugins.GoogleAuth.signIn();
      console.log('[GoogleAuth] result:', JSON.stringify(result));
      const credential = GoogleAuthProvider.credential(result.idToken);
      return signInWithCredential(auth, credential);
    } catch (e) {
      console.error('[GoogleAuth] FAILED:', e?.message, e?.code);
      throw e;
    }
  } else {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }
}