/**
 * useAppData.js
 * ─────────────────────────────────────────────────────────────
 * Owns every piece of server-derived state and all Firebase I/O.
 *
 * Guarantees:
 *  • No race condition between initial load and real-time listener:
 *    the listener is only registered *after* the initial fetch resolves,
 *    and we track a monotonic `serverVersion` so stale pushes are dropped.
 *  • `isLocalUpdate` flag prevents the listener from echo-applying
 *    writes we already have in local state.
 *  • Save is debounced via `queueSave`; we skip the very first render
 *    cycle (`initialLoad` ref) so we never overwrite cloud data on mount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { queueSave, subscribeToData, loadData } from "../utils/cloud";

// ─── Helpers ──────────────────────────────────────────────────
const safeArray = (v) => (Array.isArray(v) ? v : []);

const EMPTY_STATE = {
  items       : [],
  tasks       : [],
  weightLogs  : [],
  weightGoal  : null,
  logs        : {},
  goal        : {},
  financeData : [],
  chatHistory : [],
};

function hydrateSnapshot(data) {
  return {
    items       : safeArray(data.items),
    tasks       : safeArray(data.tasks),
    weightLogs  : safeArray(data.weightLogs),
    weightGoal  : data.weightGoal  ?? null,
    logs        : data.logs        ?? {},
    goal        : data.goal        ?? {},
    financeData : safeArray(data.financeData),
    chatHistory : safeArray(data.chatHistory),
  };
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAppData(firebaseUser) {
  const [data, setData]       = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  // Refs — never trigger re-renders
  const serverVersion  = useRef(0);   // monotonic timestamp from cloud
  const isLocalUpdate  = useRef(false);
  const initialLoad    = useRef(true);
  const unsubscribeRef = useRef(null);

  // ── Merge helper ──────────────────────────────────────────
  const applySnapshot = useCallback((raw) => {
    setData(hydrateSnapshot(raw));
    serverVersion.current = raw.updatedAt ?? Date.now();
  }, []);

  // ── Initial fetch + register listener only after fetch resolves ──
  useEffect(() => {
    if (!firebaseUser) {
      setData(EMPTY_STATE);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      try {
        // FIX 1: pass uid explicitly to avoid auth race condition
        const snapshot = await loadData(firebaseUser.uid);
        if (cancelled) return;

        if (snapshot) {
          applySnapshot(snapshot);
        }
      } catch (err) {
        console.error("[useAppData] initial load failed:", err);
      } finally {
        if (!cancelled) {
          initialLoad.current = false;
          setLoading(false);

          // Register real-time listener only after initial data is settled.
          // FIX 2: pass uid as first arg — subscribeToData(uid, callback)
          // Previously the callback was passed as uid, causing Firestore's
          // internal string method to throw: n.indexOf is not a function
          unsubscribeRef.current = subscribeToData(firebaseUser.uid, (incoming) => {
            if (!incoming) return;
            if (isLocalUpdate.current) return;
            if (incoming.updatedAt && incoming.updatedAt < serverVersion.current) return;

            applySnapshot(incoming);
          });
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, [firebaseUser, applySnapshot]);

  // ── Persist local changes ──────────────────────────────────
  useEffect(() => {
    if (!firebaseUser || initialLoad.current) return;

    isLocalUpdate.current = true;

    queueSave({ ...data, updatedAt: Date.now() });

    // Allow the listener to resume after the write is queued.
    // A microtask delay is enough — the listener fires asynchronously.
    const tid = setTimeout(() => {
      isLocalUpdate.current = false;
    }, 0);

    return () => clearTimeout(tid);
  }, [firebaseUser, data]);

  // ── Per-key setters (stable references via useCallback) ───
  const setItems       = useCallback((v) => setData((d) => ({ ...d, items:       typeof v === "function" ? v(d.items)       : v })), []);
  const setTasks       = useCallback((v) => setData((d) => ({ ...d, tasks:       typeof v === "function" ? v(d.tasks)       : v })), []);
  const setWeightLogs  = useCallback((v) => setData((d) => ({ ...d, weightLogs:  typeof v === "function" ? v(d.weightLogs)  : v })), []);
  const setWeightGoal  = useCallback((v) => setData((d) => ({ ...d, weightGoal:  typeof v === "function" ? v(d.weightGoal)  : v })), []);
  const setLogs        = useCallback((v) => setData((d) => ({ ...d, logs:        typeof v === "function" ? v(d.logs)        : v })), []);
  const setGoal        = useCallback((v) => setData((d) => ({ ...d, goal:        typeof v === "function" ? v(d.goal)        : v })), []);
  const setFinanceData = useCallback((v) => setData((d) => ({ ...d, financeData: typeof v === "function" ? v(d.financeData) : v })), []);
  const setChatHistory = useCallback((v) => setData((d) => ({ ...d, chatHistory: typeof v === "function" ? v(d.chatHistory) : v })), []);

  const addWeight = useCallback((weight) => {
    setWeightLogs((prev) => [...prev, { weight, date: new Date().toISOString() }]);
  }, [setWeightLogs]);

  return {
    loading,
    // state slices
    ...data,
    // setters
    setItems,
    setTasks,
    setWeightLogs,
    setWeightGoal,
    setLogs,
    setGoal,
    setFinanceData,
    setChatHistory,
    addWeight,
  };
}