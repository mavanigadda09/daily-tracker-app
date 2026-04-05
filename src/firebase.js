import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ================= CONFIG =================

// ✅ Use ENV (fallback for safety)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your_api_key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your_auth_domain",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your_bucket",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MSG_ID || "your_msg_id",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your_app_id"
};

// ================= INIT (SAFE) =================

// Prevent multiple initializations
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