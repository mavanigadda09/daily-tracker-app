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
 *   On reboot, TYPE_STEP_COUNTER resets to 0, so we also reset the
 *   baseline whenever sensorTotal < baseline (reboot detected).
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
import { Capacitor, registerPlugin }                 from "@capacitor/core";
import { auth, db }                                  from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp }      from "firebase/firestore";

// ─── Register the native plugin ──────────────────────────────
// addListener in the web stub must return a Promise<{ remove }> to
// match the signature the native path awaits.
const StepCounter = registerPlugin("StepCounter", {
  web: {
    checkPermission: async () => ({ state: "granted" }),
    requestPermission: async () => ({ state: "granted" }),
    isAvailable:     async () => ({ available: false }),
    startCounting:   async () => {},
    stopCounting:    async () => {},
    getSteps:        async () => ({ steps: -1, available: false }),
    addListener:     async () => ({ remove: () => {} }),
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

// ─── Firestore sync ───────────────────────────────────────────
// Timer ref is passed in (owned by the hook instance, not module scope)
// to avoid leaks across hot reloads and multiple hook instances.
async function syncToFirestore(steps, timerRef) {
  const uid = auth.currentUser?.uid;
  if (!uid || steps <= 0) return;

  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(async () => {
    try {
      const ref = doc(db, "users", uid, "stepLogs", todayKey());
      await setDoc(
        ref,
        { date: todayKey(), steps, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      console.warn("[useStepCounter] Firestore sync failed:", err);
    }
  }, 30_000);
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
  const lastMag   = useRef(null);
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

// ─── Permission state constants ───────────────────────────────
export const PermissionState = {
  PROMPT:  "prompt",
  GRANTED: "granted",
  DENIED:  "denied",
};

// ─── Main hook ────────────────────────────────────────────────

/**
 * useStepCounter({ goal = 10000 })
 *
 * Returns:
 *   steps            {number}   — today's step count
 *   goal             {number}   — daily goal (configurable)
 *   setGoal          {function} — update the goal
 *   percent          {number}   — 0–100 progress toward goal
 *   available        {boolean}  — native sensor found
 *   isWeb            {boolean}  — running in browser (fallback mode)
 *   permissionState  {string}   — "prompt" | "granted" | "denied"
 *   requestPermission {function} — call to trigger the system dialog
 *   weeklySteps      {number[]} — last 7 days [oldest → today]
 *   resetToday       {function} — force reset today's count (debug)
 */
export function useStepCounter({ goal: initialGoal = 10_000 } = {}) {
  const [steps,           setSteps]         = useState(getCachedSteps);
  const [goal,            setGoalState]     = useState(() => {
    try { return parseInt(localStorage.getItem("stepGoal") ?? "10000", 10); }
    catch { return initialGoal; }
  });
  const [available,       setAvailable]     = useState(false);
  const [isWeb,           setIsWeb]         = useState(false);
  const [permissionState, setPermission]    = useState(PermissionState.PROMPT);
  const [weeklySteps,     setWeekly]        = useState(() => new Array(7).fill(0));

  const listenerRef      = useRef(null);
  const firestoreTimer   = useRef(null);   // ← instance-scoped, not module-scoped
  const isNative         = Capacitor.isNativePlatform();

  // ── DeviceMotion fallback active only when no native sensor ──
  useMotionFallback(setSteps, isWeb);

  // ── Permission check + sensor init ────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // ── 1. Non-native (web / dev server) ──────────────────
      if (!isNative) {
        setIsWeb(true);
        setAvailable(false);
        setPermission(PermissionState.GRANTED);

        const saved = await loadTodayFromFirestore();
        if (mounted && saved > 0) {
          setSteps(saved);
          cacheSteps(saved);
        }
        return;
      }

      // ── 2. Check current permission state ─────────────────
      try {
        const { state } = await StepCounter.checkPermission();
        if (!mounted) return;
        setPermission(state ?? PermissionState.PROMPT);

        // If denied, stop here — show badge, don't start sensor
        if (state === PermissionState.DENIED) return;

        // If not yet granted, request now (first launch)
        if (state !== PermissionState.GRANTED) {
          const { state: newState } = await StepCounter.requestPermission();
          if (!mounted) return;
          setPermission(newState);
          if (newState !== PermissionState.GRANTED) return;
        }
      } catch (err) {
        console.warn("[useStepCounter] Permission check failed:", err);
        if (mounted) setPermission(PermissionState.DENIED);
        return;
      }

      // ── 3. Permission granted — check hardware ─────────────
      try {
        const { available: hw } = await StepCounter.isAvailable();
        if (!mounted) return;

        if (!hw) {
          setAvailable(false);
          setIsWeb(true);

          const saved = await loadTodayFromFirestore();
          if (mounted && saved > 0) {
            setSteps(saved);
            cacheSteps(saved);
          }
          return;
        }

        setAvailable(true);
        setIsWeb(false);

        // ── 4. Start sensor + attach listener ─────────────────
        await StepCounter.startCounting();   // ← correct method name

        listenerRef.current = await StepCounter.addListener(
          "stepUpdate",
          ({ steps: sensorTotal }) => {
            if (!mounted) return;

            let baseline = getBaseline();

            // Reboot detection: sensor reset to 0 or below saved baseline
            if (baseline === null || sensorTotal < baseline) {
              baseline = sensorTotal;
              saveBaseline(baseline);
            }

            const todaySteps = Math.max(0, sensorTotal - baseline);
            setSteps(todaySteps);
            cacheSteps(todaySteps);
            syncToFirestore(todaySteps, firestoreTimer);
          }
        );

      } catch (err) {
        console.warn("[useStepCounter] Sensor init failed, using fallback:", err);
        if (mounted) {
          setAvailable(false);
          setIsWeb(true);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      listenerRef.current?.remove?.();
      clearTimeout(firestoreTimer.current);
      if (isNative) {
        StepCounter.stopCounting().catch(() => {});   // ← correct method name
      }
    };
  }, [isNative]);

  // ── Manual permission request (for "try again" badge button) ─
  const requestPermission = useCallback(async () => {
    if (!isNative) return PermissionState.GRANTED;
    try {
      const { state } = await StepCounter.requestPermission();
      setPermission(state);
      return state;
    } catch {
      setPermission(PermissionState.DENIED);
      return PermissionState.DENIED;
    }
  }, [isNative]);

  // ── Midnight reset ─────────────────────────────────────────
  useEffect(() => {
    const now             = new Date();
    const tomorrow        = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;

    const timer = setTimeout(() => {
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
            // Today's live count is filled in below from state — skip Firestore
            if (date === todayKey()) return 0;
            try {
              const ref  = doc(db, "users", uid, "stepLogs", date);
              const snap = await getDoc(ref);
              return snap.exists() ? (snap.data().steps ?? 0) : 0;
            } catch {
              return 0;
            }
          })
        );
        // Index 6 = today; always use live state, never the placeholder
        // We set it to 0 here; the derived fullWeekly below fills it from steps.
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

  // ── Fill today into weekly array (no null placeholder) ────
  // weeklySteps[6] is always 0 from Firestore load above;
  // we derive fullWeekly fresh each render so it's always current.
  const fullWeekly = weeklySteps.map((v, i) => (i === 6 ? steps : v));

  return {
    steps,
    goal,
    setGoal,
    percent:          Math.min(100, Math.round((steps / goal) * 100)),
    available,
    isWeb,
    permissionState,
    requestPermission,
    weeklySteps:      fullWeekly,
    resetToday,
  };
}