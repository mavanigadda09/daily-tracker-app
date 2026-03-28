import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔐 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBO1F1JrlosiNxsy9hh56jWldE8l-T57wQ",
  authDomain: "ignira-os.firebaseapp.com",
  projectId: "ignira-os",
  storageBucket: "ignira-os.appspot.com", // ✅ FIXED
  messagingSenderId: "287796839565",
  appId: "1:287796839565:web:0a4780615d4f192bcb8ec4",
  measurementId: "G-DZRYRMVNPR"
};

// 🚀 Initialize
const app = initializeApp(firebaseConfig);

// 🔐 Auth
export const auth = getAuth(app);

// ☁️ Firestore DB
export const db = getFirestore(app);