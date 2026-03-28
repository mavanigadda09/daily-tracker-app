import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔐 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBO1F1JrlosiNxsy9hh56jWldE8l-T57wQ",
  authDomain: "ignira-os.firebaseapp.com",
  projectId: "ignira-os",
  storageBucket: "ignira-os.appspot.com",
  messagingSenderId: "287796839565",
  appId: "1:287796839565:web:0a4780615d4f192bcb8ec4",
  measurementId: "G-DZRYRMVNPR"
};

// 🚀 Initialize App
const app = initializeApp(firebaseConfig);

// 🔐 Auth
export const auth = getAuth(app);

// ☁️ Firestore
export const db = getFirestore(app);

// 🔵 Google Provider
const provider = new GoogleAuthProvider();

// ================= GOOGLE LOGIN =================
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    console.log("✅ Google User:", user);

    return user;
  } catch (error) {
    console.error("❌ Google Login Error:", error);
    throw error;
  }
};

// ================= LOGOUT =================
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("❌ Logout Error:", error);
  }
};