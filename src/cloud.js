import { db, auth } from "./firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

/* ================= CONFIG ================= */
const LOCAL_KEY = "tracker_backup_v3";

/* ================= SAFE ================= */
const safeData = (data = {}) => ({
  items: data.items || [],
  logs: data.logs || {},
  weightLogs: data.weightLogs || [],
  weightGoal: data.weightGoal || null,
  tasks: data.tasks || [],
  goal: data.goal || {},
  financeData: data.financeData || [],
  chatHistory: data.chatHistory || [],
  updatedAt: data.updatedAt || 0
});

/* ================= LOCAL ================= */
const getLocalBackup = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? safeData(JSON.parse(raw)) : safeData();
  } catch {
    return safeData();
  }
};

const setLocalBackup = (data) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
};

/* ================= SAVE (🔥 SIMPLE + FIXED) ================= */
export const queueSave = async (data) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const payload = {
      ...safeData(data),
      updatedAt: Date.now()
    };

    // ✅ update local immediately
    setLocalBackup(payload);

    // ✅ save instantly to Firestore (NO DELAY)
    const docRef = doc(db, "users", user.uid);
    await setDoc(docRef, payload, { merge: false });

    console.log("✅ Cloud saved");

  } catch (err) {
    console.error("🔥 Save error:", err);
  }
};

/* ================= LOAD ================= */
export const loadData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return getLocalBackup();

    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    const local = getLocalBackup();

    if (snap.exists()) {
      const remote = safeData(snap.data());

      // ✅ choose latest
      const final =
        remote.updatedAt > local.updatedAt ? remote : local;

      setLocalBackup(final);
      return final;
    }

    return local;

  } catch (err) {
    console.error("🔥 Load error:", err);
    return getLocalBackup();
  }
};

/* ================= REALTIME ================= */
export const subscribeToData = (callback) => {
  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(db, "users", user.uid);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) return;

      const remote = safeData(snapshot.data());
      const local = getLocalBackup();

      // ✅ ignore stale data
      if (remote.updatedAt <= local.updatedAt) {
        console.log("⏩ Ignoring stale cloud");
        return;
      }

      console.log("☁️ Applying cloud update");

      setLocalBackup(remote);
      callback(remote);
    },
    (error) => {
      console.error("🔥 Realtime error:", error);
    }
  );
};

/* ================= FINANCE HELPERS (FIX BUILD ERROR) ================= */

export const addFinance = (item, setFinanceData) => {
  setFinanceData(prev => [...prev, item]);
};

export const deleteFinance = (id, setFinanceData) => {
  setFinanceData(prev => prev.filter(f => f.id !== id));
};