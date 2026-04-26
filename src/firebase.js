import { initializeApp } from 'firebase/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Google Sign-In ────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('[GoogleAuth] Initializing plugin...');

      // FIX: initialize() must be called before signIn() on every invocation.
      // The plugin's load() lifecycle does NOT reliably run before signIn()
      // on Capacitor 8 with 3.4.0-rc.4, leaving GoogleSignInClient null → crash.
      await GoogleAuth.initialize({
        clientId: '287796839565-ds6ag7l9io777n0limmnctq3i4c1sne6.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });

      console.log('[GoogleAuth] Calling signIn...');
      const googleUser = await GoogleAuth.signIn();
      console.log('[GoogleAuth] signIn result:', JSON.stringify(googleUser));

      const idToken = googleUser?.authentication?.idToken;
      if (!idToken) throw new Error('No idToken returned from GoogleAuth.signIn()');

      const credential = GoogleAuthProvider.credential(idToken);
      return signInWithCredential(auth, credential);
    } catch (err) {
      console.error('[GoogleAuth] Native sign-in failed:', err?.message || err);
      throw err;
    }
  } else {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }
}

export async function consumeRedirectResult() {
  return null;
}