import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

const LOCAL_KEY = "tracker_backup";
const QUEUE_KEY = "tracker_queue";

// ================= 💾 GENERIC UPDATE (NEW - IMPORTANT) =================
export const updateData = (partial) => {
  const current = getLocalBackup();

  const updated = mergeData(current, partial);

  queueSave(updated);
};

// ================= 💾 SAVE QUEUE =================
export const queueSave = (data) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));

    const queue = getQueue();
    queue.push({
      data,
      timestamp: Date.now()
    });

    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    processQueue();

  } catch (err) {
    console.error("🔥 Queue save error:", err);
  }
};

// ================= 🔄 PROCESS QUEUE =================
const processQueue = async () => {
  const user = auth.currentUser;
  if (!user) return;

  let queue = getQueue();
  if (!queue.length) return;

  const docRef = doc(db, "users", user.uid);

  while (queue.length > 0) {
    const item = queue[0];

    try {
      const remoteSnap = await getDoc(docRef);
      const remoteData = remoteSnap.exists()
        ? safeData(remoteSnap.data())
        : safeData();

      const merged = mergeData(remoteData, item.data);

      await setDoc(docRef, merged, { merge: true });

      queue.shift();
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    } catch (err) {
      console.error("🔥 Sync failed, retry later:", err);
      break;
    }
  }
};

// ================= 📥 LOAD DATA =================
export const loadData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();

      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));

      return safeData(data);
    }

    return getLocalBackup();

  } catch (err) {
    console.error("🔥 Load error:", err);
    return getLocalBackup();
  }
};

// ================= ⚡ REALTIME =================
export const subscribeToData = (callback) => {
  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(db, "users", user.uid);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(getLocalBackup());
        return;
      }

      const remote = safeData(snapshot.data());
      const local = getLocalBackup();

      const merged = mergeData(remote, local);

      localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));

      callback(merged);
    },
    (error) => {
      console.error("🔥 Realtime error:", error);
      callback(getLocalBackup());
    }
  );

  return unsubscribe;
};

// ================= 🌐 BACKGROUND SYNC =================
setInterval(() => {
  processQueue();
}, 5000);

window.addEventListener("online", () => {
  console.log("🌐 Back online → syncing...");
  processQueue();
});

// ================= 🧠 SAFE DATA =================
const safeData = (data = {}) => ({
  items: data.items || [],
  logs: data.logs || {},
  weightLogs: data.weightLogs || [],
  weightGoal: data.weightGoal || null,
  tasks: data.tasks || [],
  goal: data.goal || {},
  financeData: data.financeData || [],
  chatHistory: data.chatHistory || []
});

// ================= 🔥 MERGE =================
const mergeData = (remote, local) => {
  return {
    items: mergeArray(remote.items, local.items),
    logs: { ...remote.logs, ...local.logs },
    weightLogs: mergeArray(remote.weightLogs, local.weightLogs),
    weightGoal: local.weightGoal ?? remote.weightGoal,
    tasks: mergeArray(remote.tasks, local.tasks),
    goal: local.goal || remote.goal,
    financeData: mergeArray(remote.financeData, local.financeData),
    chatHistory: mergeArray(remote.chatHistory, local.chatHistory)
  };
};

// ================= 🔄 ARRAY MERGE =================
const mergeArray = (a = [], b = []) => {
  const map = new Map();

  [...a, ...b].forEach((item) => {
    map.set(item.id, item);
  });

  return Array.from(map.values());
};

// ================= 📦 LOCAL BACKUP =================
const getLocalBackup = () => {
  try {
    const local = localStorage.getItem(LOCAL_KEY);
    return local ? safeData(JSON.parse(local)) : safeData();
  } catch {
    return safeData();
  }
};

// ================= 📋 QUEUE =================
const getQueue = () => {
  try {
    const q = localStorage.getItem(QUEUE_KEY);
    return q ? JSON.parse(q) : [];
  } catch {
    return [];
  }
};

// ================= 💰 FINANCE HELPERS =================

// ADD
export const addFinance = (entry) => {
  try {
    // Validate input
    if (!entry || typeof entry !== 'object') {
      console.error("🔥 addFinance: Invalid entry object");
      return false;
    }

    const numAmount = Number(entry.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.error("🔥 addFinance: Invalid amount", entry.amount);
      return false;
    }

    if (!['income', 'expense'].includes(entry.type)) {
      console.error("🔥 addFinance: Invalid type", entry.type);
      return false;
    }

    const newEntry = {
      id: crypto.randomUUID(),
      type: entry.type,
      amount: numAmount,
      category: String(entry.category || "Other").substring(0, 50), // Limit length
      note: String(entry.note || "").substring(0, 200), // Limit length
      date: Date.now(),
      createdAt: Date.now()
    };

    const current = getLocalBackup();

    // Check for potential duplicates (same amount, category, within last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentEntries = current.financeData.filter(f =>
      f.amount === numAmount &&
      f.category === entry.category &&
      f.type === entry.type &&
      f.createdAt > fiveMinutesAgo
    );

    if (recentEntries.length > 0) {
      console.warn("⚠️ Potential duplicate entry detected, skipping");
      return false;
    }

    updateData({
      financeData: [...current.financeData, newEntry]
    });

    console.log("✅ Finance entry added:", newEntry);
    return true;

  } catch (err) {
    console.error("🔥 addFinance error:", err);
    return false;
  }
};

// DELETE
export const deleteFinance = (id) => {
  const current = getLocalBackup();

  updateData({
    financeData: current.financeData.filter(f => f.id !== id)
  });
};