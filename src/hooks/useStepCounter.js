/**
 * hooks/useStepCounter.js
 * ─────────────────────────────────────────────────────────────
 * Bridges the native Android StepCounterPlugin to React.
 *
 * How daily step counting works:
 *   Android's TYPE_STEP_COUNTER reports TOTAL steps since last reboot.
 *   We store a "baseline" (the sensor value at the start of today) in
 *   localStorage. Today's steps = sensorTotal - baseline.
 *   At midnight the baseline resets automatically.
 *
 * Firestore sync:
 *   Steps are persisted to users/{uid}/stepLogs/{YYYY-MM-DD} so data
 *   survives app reinstalls and is available in Analytics.
 *
 * Fallback:
 *   On web (no Capacitor), uses DeviceMotion accelerometer so the
 *   hook still works during development in Chrome.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { registerPlugin }                            from "@capacitor/core";
import { auth, db }                                  from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp }      from "firebase/firestore";

// ─── Register the native plugin ──────────────────────────────
// This is a thin JS stub — the real implementation is in
// StepCounterPlugin.java. Capacitor wires them together at runtime.
const StepCounter = registerPlugin("StepCounter", {
  web: {
    // Web stub — falls back to DeviceMotion on non-Capacitor environments
    isAvailable: async () => ({ available: false }),
    start:       async () => ({ started: false }),
    stop:        async () => ({ stopped: true }),
    getSteps:    async () => ({ steps: -1, available: false }),
    addListener: () => ({ remove: () => {} }),
  },
});

// ─── Helpers ─────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getBaseline() {
  try {
    const raw = localStorage.getItem("stepBaseline");
    if (!raw) return null;
    const { date, value } = JSON.parse(raw);
    if (date !== todayKey()) return null; // new day — discard
    return value;
  } catch {
    return null;
  }
}

function saveBaseline(sensorTotal) {
  try {
    localStorage.setItem(
      "stepBaseline",
      JSON.stringify({ date: todayKey(), value: sensorTotal })
    );
  } catch {}
}

function getCachedSteps() {
  try {
    const raw = localStorage.getItem("stepCache");
    if (!raw) return 0;
    const { date, steps } = JSON.parse(raw);
    if (date !== todayKey()) return 0;
    return steps ?? 0;
  } catch {
    return 0;
  }
}

function cacheSteps(steps) {
  try {
    localStorage.setItem(
      "stepCache",
      JSON.stringify({ date: todayKey(), steps })
    );
  } catch {}
}

// ─── Firestore sync (debounced — max 1 write per 30s) ────────
let firestoreWriteTimer = null;

async function syncToFirestore(steps) {
  const uid = auth.currentUser?.uid;
  if (!uid || steps <= 0) return;

  clearTimeout(firestoreWriteTimer);
  firestoreWriteTimer = setTimeout(async () => {
    try {
      const ref = doc(db, "users", uid, "stepLogs", todayKey());
      await setDoc(ref, {
        date:      todayKey(),
        steps,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn("[useStepCounter] Firestore sync failed:", err);
    }
  }, 30_000); // debounce 30 seconds
}

async function loadTodayFromFirestore() {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;
  try {
    const ref  = doc(db, "users", uid, "stepLogs", todayKey());
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data().steps ?? 0) : 0;
  } catch {
    return 0;
  }
}

// ─── DeviceMotion fallback (web / dev only) ──────────────────
function useMotionFallback(setSteps, active) {
  const lastMag  = useRef(null);
  const stepCount = useRef(0);
  const THRESHOLD = 12;

  useEffect(() => {
    if (!active) return;
    if (typeof DeviceMotionEvent === "undefined") return;

    const handler = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

      if (lastMag.current !== null) {
        const delta = Math.abs(mag - lastMag.current);
        if (delta > THRESHOLD) {
          stepCount.current += 1;
          setSteps(stepCount.current);
          cacheSteps(stepCount.current);
        }
      }
      lastMag.current = mag;
    };

    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [active, setSteps]);
}

// ─── Main hook ────────────────────────────────────────────────

/**
 * useStepCounter({ goal = 10000 })
 *
 * Returns:
 *   steps        {number}   — today's step count
 *   goal         {number}   — daily goal (configurable)
 *   setGoal      {function} — update the goal
 *   percent      {number}   — 0–100 progress toward goal
 *   available    {boolean}  — native sensor found
 *   isWeb        {boolean}  — running in browser (fallback mode)
 *   weeklySteps  {number[]} — last 7 days [oldest → today]
 *   resetToday   {function} — force reset today's count (debug)
 */
export function useStepCounter({ goal: initialGoal = 10_000 } = {}) {
  const [steps,       setSteps]      = useState(getCachedSteps);
  const [goal,        setGoalState]  = useState(() => {
    try { return parseInt(localStorage.getItem("stepGoal") ?? "10000", 10); }
    catch { return initialGoal; }
  });
  const [available,   setAvailable]  = useState(false);
  const [isWeb,       setIsWeb]      = useState(false);
  const [weeklySteps, setWeekly]     = useState([]);

  const listenerRef = useRef(null);

  // ── Start native sensor ────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const initNative = async () => {
      try {
        const { available: hw } = await StepCounter.isAvailable();
        if (!mounted) return;

        if (!hw) {
          // No native sensor — use DeviceMotion fallback
          setIsWeb(true);
          setAvailable(false);

          // Load any steps saved from Firestore as starting point
          const saved = await loadTodayFromFirestore();
          if (mounted && saved > 0) {
            setSteps(saved);
            cacheSteps(saved);
          }
          return;
        }

        setAvailable(true);
        setIsWeb(false);

        await StepCounter.start();

        // Listen for live sensor events
        listenerRef.current = await StepCounter.addListener(
          "stepUpdate",
          ({ steps: sensorTotal }) => {
            if (!mounted) return;

            // Calculate today's steps using baseline
            let baseline = getBaseline();
            if (baseline === null) {
              // First reading of the day — set baseline
              baseline = sensorTotal;
              saveBaseline(baseline);
            }

            const todaySteps = Math.max(0, sensorTotal - baseline);
            setSteps(todaySteps);
            cacheSteps(todaySteps);
            syncToFirestore(todaySteps);
          }
        );

      } catch (err) {
        console.warn("[useStepCounter] Native init failed, using fallback:", err);
        if (mounted) setIsWeb(true);
      }
    };

    initNative();

    return () => {
      mounted = false;
      listenerRef.current?.remove?.();
      StepCounter.stop().catch(() => {});
    };
  }, []);

  // ── Midnight reset ─────────────────────────────────────────
  useEffect(() => {
    const now         = new Date();
    const tomorrow    = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;

    const timer = setTimeout(() => {
      // New day — clear baseline so native sensor resets today's count
      localStorage.removeItem("stepBaseline");
      localStorage.removeItem("stepCache");
      setSteps(0);
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  // ── Load weekly history from Firestore ────────────────────
  useEffect(() => {
    const loadWeekly = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }

      try {
        const counts = await Promise.all(
          days.map(async (date) => {
            // Today's count comes from live state, not Firestore
            if (date === todayKey()) return null;
            try {
              const ref  = doc(db, "users", uid, "stepLogs", date);
              const snap = await getDoc(ref);
              return snap.exists() ? snap.data().steps : 0;
            } catch {
              return 0;
            }
          })
        );
        // Replace today's null placeholder with live steps
        counts[6] = null; // will be filled by steps state
        setWeekly(counts);
      } catch {
        setWeekly(new Array(7).fill(0));
      }
    };

    loadWeekly();
  }, []);

  // ── Goal persistence ──────────────────────────────────────
  const setGoal = useCallback((newGoal) => {
    const val = Math.max(1000, Math.min(100_000, newGoal));
    setGoalState(val);
    try { localStorage.setItem("stepGoal", String(val)); } catch {}
  }, []);

  // ── Force reset (debug / testing) ─────────────────────────
  const resetToday = useCallback(() => {
    localStorage.removeItem("stepBaseline");
    localStorage.removeItem("stepCache");
    setSteps(0);
  }, []);

  // ── Fill today into weekly array ──────────────────────────
  const fullWeekly = [...weeklySteps];
  if (fullWeekly.length === 7) fullWeekly[6] = steps;

  return {
    steps,
    goal,
    setGoal,
    percent:     Math.min(100, Math.round((steps / goal) * 100)),
    available,
    isWeb,
    weeklySteps: fullWeekly,
    resetToday,
  };
}