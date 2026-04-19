import { db, auth } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

// ─── Config ───────────────────────────────────────────────────
const LOCAL_KEY = "tracker_backup_v3";

// ─── Data shape ───────────────────────────────────────────────
/**
 * Normalises any incoming data object to the full expected shape.
 * Prevents undefined field access throughout the app.
 */
const safeData = (data = {}) => ({
  items:       data.items       ?? [],
  logs:        data.logs        ?? {},
  weightLogs:  data.weightLogs  ?? [],
  weightGoal:  data.weightGoal  ?? null,
  tasks:       data.tasks       ?? [],
  goal:        data.goal        ?? {},
  financeData: data.financeData ?? [],
  chatHistory: data.chatHistory ?? [],
  updatedAt:   data.updatedAt   ?? 0,
});

// ─── Local cache ──────────────────────────────────────────────
const getLocalBackup = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? safeData(JSON.parse(raw)) : safeData();
  } catch {
    return safeData();
  }
};

const setLocalBackup = (data) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("[Cloud] Local write failed:", err);
  }
};

// ─── Save ─────────────────────────────────────────────────────
/**
 * Persist data locally + to Firestore.
 *
 * Uses merge: true — only the fields in `payload` are written.
 * This prevents a second tab's save from wiping fields it doesn't own.
 *
 * @param {object} data — full app state snapshot
 */
export const queueSave = async (data) => {
  const payload = { ...safeData(data), updatedAt: Date.now() };

  // Always write locally first — works offline
  setLocalBackup(payload);

  const user = auth.currentUser;
  if (!user) {
    console.warn("[Cloud] No auth user — saved locally only.");
    return;
  }

  try {
    await setDoc(doc(db, "users", user.uid), payload, { merge: true });
  } catch (err) {
    console.error("[Cloud] Firestore save failed:", err);
    // Local backup already written — data is not lost
  }
};

// ─── Load ─────────────────────────────────────────────────────
/**
 * Load data on app startup.
 * Compares cloud vs local timestamps and returns the newer one.
 *
 * @param {string} [uid] — pass explicitly to avoid auth race conditions
 */
export const loadData = async (uid) => {
  const local = getLocalBackup();
  const resolvedUid = uid ?? auth.currentUser?.uid;

  if (!resolvedUid) {
    console.warn("[Cloud] No uid — using local data.");
    return local;
  }

  try {
    const snap = await getDoc(doc(db, "users", resolvedUid));
    if (!snap.exists()) return local;

    const remote = safeData(snap.data());

    // Prefer whichever copy is newer
    const winner = remote.updatedAt > local.updatedAt ? remote : local;
    setLocalBackup(winner);
    return winner;
  } catch (err) {
    console.error("[Cloud] Load failed — falling back to local:", err);
    return local;
  }
};

// ─── Realtime ─────────────────────────────────────────────────
/**
 * Subscribe to Firestore realtime updates for the given user.
 *
 * Takes `uid` as a parameter — NOT auth.currentUser — to avoid
 * the auth race condition where currentUser is null during startup.
 *
 * @param {string}   uid      — Firebase user uid
 * @param {function} callback — called with new data when cloud updates
 * @returns {function} unsubscribe
 */
export const subscribeToData = (uid, callback = () => {}) => {
  if (!uid) {
    console.warn("[Cloud] subscribeToData called without uid.");
    return () => {};
  }

  try {
    return onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const remote = safeData(snapshot.data());
        const local  = getLocalBackup();

        // Ignore stale cloud pushes (e.g. echoes of our own saves)
        if (remote.updatedAt <= local.updatedAt) return;

        setLocalBackup(remote);
        callback(remote);
      },
      (error) => {
        console.error("[Cloud] Realtime listener error:", error);
      }
    );
  } catch (err) {
    console.error("[Cloud] subscribeToData crashed:", err);
    return () => {};
  }
};

// ─── Finance ──────────────────────────────────────────────────
/**
 * Add a finance entry to the user's financeData array.
 * Reads current local state, appends, then persists.
 *
 * @param {object} entry — { id, amount, category, note, date, ... }
 */
export const addFinance = async (entry) => {
  const current = getLocalBackup();
  const updated = {
    ...current,
    financeData: [
      ...current.financeData,
      { ...entry, id: entry.id ?? crypto.randomUUID(), createdAt: Date.now() },
    ],
  };
  await queueSave(updated);
};

/**
 * Delete a finance entry by id.
 *
 * @param {string|object} entryOrId — the entry object or its id string
 */
export const deleteFinance = async (entryOrId) => {
  const id = typeof entryOrId === "string" ? entryOrId : entryOrId?.id;
  if (!id) {
    console.warn("[Cloud] deleteFinance called without a valid id.");
    return;
  }
  const current = getLocalBackup();
  const updated = {
    ...current,
    financeData: current.financeData.filter((f) => f.id !== id),
  };
  await queueSave(updated);
};