import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ================= CONFIG =================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ================= INIT (SAFE) =================

// Prevent multiple Firebase instances
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ================= SERVICES =================

export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

// ================= AUTH HELPERS =================

// 🔐 Google Login
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);

    return {
      user: result.user,
      success: true
    };
  } catch (error) {
    console.error("❌ Google Login Error:", error);

    return {
      success: false,
      error: error.message
    };
  }
};

// 🚪 Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("❌ Logout Error:", error);

    return {
      success: false,
      error: error.message
    };
  }
};