import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "firebase/firestore";

/* ================= CONFIG ================= */
const LOCAL_KEY = "tracker_backup_v2";
const QUEUE_KEY = "tracker_queue_v2";

let isProcessing = false;
let saveTimeout = null;

/* ================= UPDATE ================= */
export const updateData = (partial) => {
  const current = getLocalBackup();

  const updated = {
    ...current,
    ...partial,
    updatedAt: Date.now() // 🔥 CRITICAL
  };

  queueSave(updated);
};

/* ================= SAVE ================= */
export const queueSave = (data) => {
  try {
    const withTimestamp = {
      ...data,
      updatedAt: Date.now()
    };

    localStorage.setItem(LOCAL_KEY, JSON.stringify(withTimestamp));

    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
      const queue = getQueue();

      if (queue.length > 20) queue.shift();

      queue.push(withTimestamp);

      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      processQueue();
    }, 400);

  } catch (err) {
    console.error("🔥 Queue save error:", err);
  }
};

/* ================= PROCESS QUEUE ================= */
const processQueue = async () => {
  if (isProcessing) return;

  const user = auth.currentUser;
  if (!user) return;

  let queue = getQueue();
  if (!queue.length) return;

  isProcessing = true;

  const docRef = doc(db, "users", user.uid);

  while (queue.length > 0) {
    const item = queue[0];

    try {
      const remoteSnap = await getDoc(docRef);

      const remoteData = remoteSnap.exists()
        ? safeData(remoteSnap.data())
        : safeData();

      /* 🔥 CRITICAL FIX */
      if (
        remoteData.updatedAt &&
        remoteData.updatedAt > item.updatedAt
      ) {
        console.log("⏩ Skipping older local update");
        queue.shift();
        continue;
      }

      await setDoc(docRef, item, { merge: false });

      queue.shift();
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    } catch (err) {
      console.error("🔥 Sync failed:", err);
      break;
    }
  }

  isProcessing = false;
};

/* ================= LOAD ================= */
export const loadData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    const local = getLocalBackup();

    if (snap.exists()) {
      const remote = safeData(snap.data());

      /* 🔥 PICK NEWEST */
      const final =
        remote.updatedAt > local.updatedAt ? remote : local;

      localStorage.setItem(LOCAL_KEY, JSON.stringify(final));

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
      if (!snapshot.exists()) {
        callback(getLocalBackup());
        return;
      }

      const remote = safeData(snapshot.data());
      const local = getLocalBackup();

      /* 🔥 CRITICAL FIX */
      if (remote.updatedAt < local.updatedAt) {
        console.log("⏩ Ignoring stale remote data");
        callback(local);
        return;
      }

      localStorage.setItem(LOCAL_KEY, JSON.stringify(remote));

      callback(remote);
    },
    (error) => {
      console.error("🔥 Realtime error:", error);
      callback(getLocalBackup());
    }
  );
};

/* ================= ONLINE ================= */
window.addEventListener("online", () => {
  console.log("🌐 Back online → syncing...");
  processQueue();
});

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
    const local = localStorage.getItem(LOCAL_KEY);
    return local ? safeData(JSON.parse(local)) : safeData();
  } catch {
    return safeData();
  }
};

/* ================= QUEUE ================= */
const getQueue = () => {
  try {
    const q = localStorage.getItem(QUEUE_KEY);
    return q ? JSON.parse(q) : [];
  } catch {
    return [];
  }
};