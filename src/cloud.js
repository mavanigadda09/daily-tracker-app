import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "firebase/firestore";

// ================= 💾 SAVE DATA =================
export const saveData = async (data) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(
      doc(db, "users", user.uid),
      data,
      { merge: true } // ✅ prevents overwrite
    );
  } catch (err) {
    console.error("🔥 Save error:", err);
  }
};

// ================= 📥 LOAD DATA (ONE TIME) =================
export const loadData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("🔥 Load error:", err);
    return null;
  }
};

// ================= ⚡ REAL-TIME SYNC =================
export const subscribeToData = (callback) => {
  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(db, "users", user.uid);

  // 🔥 Live listener
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("🔥 Realtime error:", error);
    }
  );

  return unsubscribe;
};