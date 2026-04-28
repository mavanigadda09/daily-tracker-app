/**
 * hooks/useRunTracker.js
 * v3 — adds Firestore run saving on stop
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ─── Constants ───────────────────────────────────────────────────────────────
const ROLLING_PACE_WINDOW = 5;
const MET                 = 8.0;
const WEIGHT_KG           = 70;
const GPS_OPTIONS         = {
  enableHighAccuracy: true,
  timeout           : 15_000,
  maximumAge        : 3_000,
};

export const RunPermission = Object.freeze({
  PROMPT : "prompt",
  GRANTED: "granted",
  DENIED : "denied",
});

// ─── Haversine ───────────────────────────────────────────────────────────────
function haversine(a, b) {
  const R    = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const chord  =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

function fmtTime(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function fmtPace(minPerKm) {
  if (!isFinite(minPerKm) || minPerKm <= 0 || minPerKm > 60) return "--:--";
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useRunTracker() {
  const [runState,        setRunState]        = useState("idle");
  const [elapsed,         setElapsed]         = useState(0);
  const [distance,        setDistance]        = useState(0);
  const [currentPace,     setCurrentPace]     = useState("--:--");
  const [avgPace,         setAvgPace]         = useState("--:--");
  const [calories,        setCalories]        = useState(0);
  const [permissionState, setPermissionState] = useState(RunPermission.PROMPT);
  const [gpsError,        setGpsError]        = useState(null);
  const [isSaving,        setIsSaving]        = useState(false);
  const [lastSavedRun,    setLastSavedRun]    = useState(null);

  const watchIdRef  = useRef(null);
  const timerRef    = useRef(null);
  const pointsRef   = useRef([]);
  const elapsedRef  = useRef(0);
  const distanceRef = useRef(0);
  const avgPaceRef  = useRef("--:--");

  // ── Check permission on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const status = await Geolocation.checkPermissions();
        if (status.location === "granted") {
          setPermissionState(RunPermission.GRANTED);
        } else if (status.location === "denied") {
          setPermissionState(RunPermission.DENIED);
        } else {
          setPermissionState(RunPermission.PROMPT);
        }
      } catch (e) {
        console.warn("[RunTracker] checkPermissions failed:", e);
        setPermissionState(RunPermission.DENIED);
      }
    })();
  }, []);

  // ── Request permission ────────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    try {
      const status = await Geolocation.requestPermissions({ permissions: ["location"] });
      const granted = status.location === "granted";
      setPermissionState(granted ? RunPermission.GRANTED : RunPermission.DENIED);
      return granted;
    } catch (e) {
      console.warn("[RunTracker] requestPermissions failed:", e);
      setPermissionState(RunPermission.DENIED);
      return false;
    }
  }, []);

  // ── GPS position handler ──────────────────────────────────────────────────
  const handlePosition = useCallback((pos, err) => {
    if (err) {
      console.warn("[RunTracker] position error:", err);
      return;
    }
    if (!pos?.coords) return;

    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    const ts   = pos.timestamp ?? Date.now();
    const prev = pointsRef.current.at(-1);

    if (accuracy > 30 && pointsRef.current.length > 0) return;

    const newPoint = { lat, lng, ts };

    if (prev) {
      const segDist = haversine(prev, newPoint);
      if (segDist < 0.2) {
        const newDist = distanceRef.current + segDist;
        distanceRef.current = newDist;
        setDistance(Math.round(newDist * 1000) / 1000);

        const window = [...pointsRef.current.slice(-ROLLING_PACE_WINDOW), newPoint];
        if (window.length >= 2) {
          const wDist = window.slice(1).reduce((acc, pt, i) => acc + haversine(window[i], pt), 0);
          const wSec  = (window.at(-1).ts - window[0].ts) / 1000;
          if (wDist > 0.01 && wSec > 0) {
            const pace = fmtPace(wSec / 60 / wDist);
            setCurrentPace(pace);
          }
        }
      }
    }

    pointsRef.current.push(newPoint);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);

      const distKm = distanceRef.current;
      if (distKm > 0.01) {
        const pace = fmtPace((elapsedRef.current / 60) / distKm);
        avgPaceRef.current = pace;
        setAvgPace(pace);
      }
      setCalories(Math.round(MET * WEIGHT_KG * (elapsedRef.current / 3600)));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // ── GPS watch ─────────────────────────────────────────────────────────────
  const startWatch = useCallback(async () => {
    try {
      await Geolocation.getCurrentPosition(GPS_OPTIONS);
      const id = await Geolocation.watchPosition(GPS_OPTIONS, handlePosition);
      watchIdRef.current = id;
      setGpsError(null);
    } catch (e) {
      console.warn("[RunTracker] startWatch failed:", e?.message ?? e);
      setGpsError("GPS unavailable — check location settings");
      setRunState("idle");
      stopTimer();
    }
  }, [handlePosition, stopTimer]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      try { Geolocation.clearWatch({ id: watchIdRef.current }); } catch {}
      watchIdRef.current = null;
    }
  }, []);

  // ── Save run to Firestore ─────────────────────────────────────────────────
  const saveRun = useCallback(async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    const finalDistance = Math.round(distanceRef.current * 1000) / 1000;
    const finalElapsed  = elapsedRef.current;
    const finalAvgPace  = avgPaceRef.current;
    const finalCalories = Math.round(MET * WEIGHT_KG * (finalElapsed / 3600));

    // Don't save trivial runs (< 10 seconds or < 10 metres)
    if (finalElapsed < 10 || finalDistance < 0.01) return;

    setIsSaving(true);
    try {
      const runData = {
        date      : serverTimestamp(),
        duration  : finalElapsed,           // seconds
        distance  : finalDistance,          // km
        avgPace   : finalAvgPace,           // "MM:SS" string
        calories  : finalCalories,
        createdAt : serverTimestamp(),
      };

      const ref = await addDoc(
        collection(db, "users", uid, "runs"),
        runData
      );

      setLastSavedRun({ id: ref.id, ...runData });
      console.log("[RunTracker] Run saved:", ref.id);
    } catch (e) {
      console.error("[RunTracker] Failed to save run:", e);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ── Public controls ───────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setGpsError(null);

    let granted = permissionState === RunPermission.GRANTED;
    if (!granted) {
      granted = await requestPermission();
      if (!granted) return;
    }

    pointsRef.current   = [];
    elapsedRef.current  = 0;
    distanceRef.current = 0;
    avgPaceRef.current  = "--:--";
    setElapsed(0);
    setDistance(0);
    setCurrentPace("--:--");
    setAvgPace("--:--");
    setCalories(0);
    setLastSavedRun(null);

    setRunState("running");
    startTimer();
    await startWatch();
  }, [permissionState, requestPermission, startTimer, startWatch]);

  const pause = useCallback(() => {
    setRunState("paused");
    stopTimer();
    stopWatch();
  }, [stopTimer, stopWatch]);

  const resume = useCallback(async () => {
    setRunState("running");
    startTimer();
    await startWatch();
  }, [startTimer, startWatch]);

  // stop — saves run to Firestore then resets
  const stop = useCallback(async () => {
    stopTimer();
    stopWatch();
    await saveRun();      // ← save before resetting refs
    setRunState("idle");
  }, [stopTimer, stopWatch, saveRun]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopTimer();
      stopWatch();
    };
  }, [stopTimer, stopWatch]);

  return {
    runState,
    elapsed,
    elapsedFmt: fmtTime(elapsed),
    distance,
    currentPace,
    avgPace,
    calories,
    permissionState,
    gpsError,
    isSaving,
    lastSavedRun,
    start,
    pause,
    resume,
    stop,
    requestPermission,
  };
}