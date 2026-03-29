import { db, auth } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "firebase/firestore";

const LOCAL_KEY = "tracker_backup";
const QUEUE_KEY = "tracker_queue";

// ================= 🧠 SAVE QUEUE =================
export const queueSave = (data) => {
  try {
    // 🔥 ADD HISTORY SNAPSHOT
    const withHistory = addHistory(data);

    // ✅ save latest locally
    localStorage.setItem(LOCAL_KEY, JSON.stringify(withHistory));

    // ✅ push to queue
    const queue = getQueue();
    queue.push({
      data: withHistory,
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

// ================= 🧠 HELPERS =================
const safeData = (data = {}) => ({
  items: data.items || [],
  logs: data.logs || {},
  weightLogs: data.weightLogs || [],
  tasks: data.tasks || [],
  goal: data.goal || {},
  history: data.history || []
});

// ================= 🕒 HISTORY =================
const addHistory = (data) => {
  const current = getLocalBackup();

  const history = current.history || [];

  const snapshot = {
    timestamp: Date.now(),
    data: {
      items: data.items,
      logs: data.logs,
      weightLogs: data.weightLogs,
      tasks: data.tasks,
      goal: data.goal
    }
  };

  const updated = [...history, snapshot].slice(-20); // 🔥 limit to 20

  return {
    ...data,
    history: updated
  };
};

// ================= 🔥 MERGE =================
const mergeData = (remote, local) => {
  return {
    items: mergeArray(remote.items, local.items),
    logs: { ...remote.logs, ...local.logs },
    weightLogs: mergeArray(remote.weightLogs, local.weightLogs),
    tasks: mergeArray(remote.tasks, local.tasks),
    goal: local.goal || remote.goal,

    // 🔥 merge history safely
    history: mergeHistory(remote.history, local.history)
  };
};

const mergeHistory = (a = [], b = []) => {
  const combined = [...a, ...b];

  const map = new Map();

  combined.forEach((h) => {
    map.set(h.timestamp, h);
  });

  return Array.from(map.values())
    .sort((x, y) => x.timestamp - y.timestamp)
    .slice(-20);
};

// merge arrays
const mergeArray = (a = [], b = []) => {
  const map = new Map();

  [...a, ...b].forEach((item) => {
    map.set(item.id || JSON.stringify(item), item);
  });

  return Array.from(map.values());
};

const getLocalBackup = () => {
  try {
    const local = localStorage.getItem(LOCAL_KEY);
    return local ? safeData(JSON.parse(local)) : safeData();
  } catch {
    return safeData();
  }
};

const getQueue = () => {
  try {
    const q = localStorage.getItem(QUEUE_KEY);
    return q ? JSON.parse(q) : [];
  } catch {
    return [];
  }
};