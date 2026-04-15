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
  } catch (err) {
    console.error("❌ Local read error:", err);
    return safeData();
  }
};

const setLocalBackup = (data) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("❌ Local write error:", err);
  }
};

/* ================= SAVE ================= */
export const queueSave = async (data) => {
  try {
    const user = auth.currentUser;

    const payload = {
      ...safeData(data),
      updatedAt: Date.now()
    };

    // ✅ ALWAYS save locally first (even if no user)
    setLocalBackup(payload);

    if (!user) {
      console.warn("⚠️ No user, saved locally only");
      return;
    }

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
    const local = getLocalBackup();

    // ✅ if no user → return local safely
    if (!user) {
      console.warn("⚠️ No user, using local data");
      return local;
    }

    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const remote = safeData(snap.data());

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
export const subscribeToData = (callback = () => {}) => {
  try {
    const user = auth.currentUser;

    // ✅ Always return cleanup function (prevents crashes)
    if (!user) {
      console.warn("⚠️ No user, realtime disabled");
      return () => {};
    }

    const docRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const remote = safeData(snapshot.data());
        const local = getLocalBackup();

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

    return unsubscribe;
  } catch (err) {
    console.error("🔥 Subscribe crash:", err);
    return () => {};
  }
};

/* ================= FINANCE HELPERS ================= */

export const addFinance = (item, setFinanceData) => {
  if (typeof setFinanceData !== "function") {
    console.error("❌ setFinanceData is not a function");
    return;
  }

  setFinanceData((prev) => [...prev, item]);
};

export const deleteFinance = (id, setFinanceData) => {
  if (typeof setFinanceData !== "function") {
    console.error("❌ setFinanceData is not a function");
    return;
  }

  setFinanceData((prev) => prev.filter((f) => f.id !== id));
};