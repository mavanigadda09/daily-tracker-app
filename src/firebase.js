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
  apiKey: "AIzaSyBO1F1JrlosiNxsy9hh56jWldE8l-T57wQ",
  authDomain: "ignira-os.firebaseapp.com",
  projectId: "ignira-os",
  storageBucket: "ignira-os.firebasestorage.app",
  messagingSenderId: "287796839565",
  appId: "1:287796839565:web:0a4780615d4f192bcb8ec4",
  measurementId: "G-DZRYRMVNPR"
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