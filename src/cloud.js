import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "firebase/firestore";

const LOCAL_KEY = "tracker_backup";
const QUEUE_KEY = "tracker_queue";

let isProcessing = false;
let saveTimeout = null;

// ================= UPDATE =================
export const updateData = (partial) => {
  const current = getLocalBackup();
  const updated = mergeData(current, partial);
  queueSave(updated);
};

// ================= SAVE (DEBOUNCED) =================
export const queueSave = (data) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));

    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
      const queue = getQueue();

      // ✅ LIMIT QUEUE SIZE
      if (queue.length > 20) queue.shift();

      queue.push({
        data,
        timestamp: Date.now()
      });

      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      processQueue();
    }, 500);

  } catch (err) {
    console.error("🔥 Queue save error:", err);
  }
};

// ================= PROCESS QUEUE =================
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

      const merged = mergeData(remoteData, item.data);

      await setDoc(docRef, merged, { merge: true });

      queue.shift();
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    } catch (err) {
      console.error("🔥 Sync failed:", err);
      break;
    }
  }

  isProcessing = false;
};

// ================= LOAD =================
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

// ================= REALTIME =================
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

      const merged = mergeData(remote, local);

      localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));

      callback(merged);
    },
    (error) => {
      console.error("🔥 Realtime error:", error);
      callback(getLocalBackup());
    }
  );
};

// ================= ONLINE SYNC =================
window.addEventListener("online", () => {
  console.log("🌐 Back online → syncing...");
  processQueue();
});

// ================= SAFE DATA =================
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

// ================= MERGE =================
const mergeData = (remote, local) => ({
  items: mergeArray(remote.items, local.items),
  logs: { ...remote.logs, ...local.logs },
  weightLogs: mergeArray(remote.weightLogs, local.weightLogs),
  weightGoal: local.weightGoal ?? remote.weightGoal,
  tasks: mergeArray(remote.tasks, local.tasks),
  goal: local.goal || remote.goal,
  financeData: mergeArray(remote.financeData, local.financeData),
  chatHistory: mergeArray(remote.chatHistory, local.chatHistory)
});

// ================= ARRAY MERGE =================
const mergeArray = (a = [], b = []) => {
  const map = new Map();

  [...a, ...b].forEach((item) => {
    if (!item?.id) return;
    map.set(item.id, item);
  });

  return Array.from(map.values());
};

// ================= LOCAL =================
const getLocalBackup = () => {
  try {
    const local = localStorage.getItem(LOCAL_KEY);
    return local ? safeData(JSON.parse(local)) : safeData();
  } catch {
    return safeData();
  }
};

// ================= QUEUE =================
const getQueue = () => {
  try {
    const q = localStorage.getItem(QUEUE_KEY);
    return q ? JSON.parse(q) : [];
  } catch {
    return [];
  }
};

// ================= FINANCE =================
export const addFinance = (entry) => {
  try {
    const amount = Number(entry.amount);
    if (!amount || amount <= 0) return false;

    const newEntry = {
      id: crypto.randomUUID(),
      type: entry.type,
      amount,
      category: entry.category || "Other",
      note: entry.note || "",
      date: Date.now()
    };

    const current = getLocalBackup();

    updateData({
      financeData: [...current.financeData, newEntry]
    });

    return true;

  } catch {
    return false;
  }
};

export const deleteFinance = (id) => {
  const current = getLocalBackup();

  updateData({
    financeData: current.financeData.filter(f => f.id !== id)
  });
};