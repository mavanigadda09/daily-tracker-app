import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "firebase/firestore";

const LOCAL_KEY = "tracker_backup";
const QUEUE_KEY = "tracker_queue";

// ================= 💾 SAVE QUEUE =================
export const queueSave = (data) => {
  try {
    // ✅ save locally first (offline support)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));

    // ✅ push to queue
    const queue = getQueue();
    queue.push({
      data,
      timestamp: Date.now()
    });

    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    // 🚀 try sync
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

      // ✅ remove synced item
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

      // ✅ update local backup
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

      // 🔥 merge remote + local
      const merged = mergeData(remote, local);

      // update local cache
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
  weightGoal: data.weightGoal || null, // 🔥 NEW
  tasks: data.tasks || [],
  goal: data.goal || {}
});

// ================= 🔥 MERGE (CONFLICT RESOLUTION) =================
const mergeData = (remote, local) => {
  return {
    items: mergeArray(remote.items, local.items),
    logs: { ...remote.logs, ...local.logs },
    weightLogs: mergeArray(remote.weightLogs, local.weightLogs),
    weightGoal: local.weightGoal ?? remote.weightGoal, // 🔥 NEW
    tasks: mergeArray(remote.tasks, local.tasks),
    goal: local.goal || remote.goal
  };
};

// ================= 🔄 ARRAY MERGE =================
const mergeArray = (a = [], b = []) => {
  const map = new Map();

  [...a, ...b].forEach((item) => {
    map.set(item.id || JSON.stringify(item), item);
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