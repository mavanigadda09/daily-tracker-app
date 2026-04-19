// src/hooks/useRoutines.js
import { useState, useMemo, useCallback } from "react";

/**
 * All Routines logic lives here.
 * UI calls handlers only — zero business logic in the component.
 *
 * NOTE: Currently syncs to localStorage.
 * Migration path: swap the persist() call to useAppData's updateRoutines()
 * when Firestore integration is ready — UI stays untouched.
 */

const DEFAULT_ROUTINES = [
  "Lift Weights",
  "Eat Healthy",
  "Drink 5L Water",
  "No Outside Food",
  "No Junk Food",
];

/** Stable ISO date key — prevents the "2025-1-5" vs "2025-01-05" bug */
function toDateKey(date) {
  return date.toISOString().split("T")[0];
}

/** Build the current week Sun–Sat with stable keys */
function buildWeek() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay()); // rewind to Sunday

  const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      label: LABELS[i],
      date: d.getDate(),
      key: toDateKey(d),
    };
  });
}

/** How many days have elapsed so far this week (min 1 to avoid div/0) */
function daysElapsed() {
  return Math.max(new Date().getDay() + 1, 1);
}

function loadFromStorage() {
  try {
    const stored = JSON.parse(localStorage.getItem("routines"));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {
    // corrupted storage — fall through to defaults
  }
  return DEFAULT_ROUTINES.map((name) => ({
    id: crypto.randomUUID(),
    name,
    completed: {},
  }));
}

export function useRoutines() {
  const [routines, setRoutines] = useState(loadFromStorage);
  const [newRoutine, setNewRoutine] = useState("");

  // Week rebuilds daily — not frozen at mount time
  const week = useMemo(buildWeek, [new Date().toDateString()]);

  const persist = useCallback((updated) => {
    setRoutines(updated);
    localStorage.setItem("routines", JSON.stringify(updated));
    // TODO: swap for updateRoutines(updated) from useAppData for Firestore sync
  }, []);

  const toggle = useCallback((id, key) => {
    setRoutines((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          completed: { ...r.completed, [key]: !r.completed?.[key] },
        };
      });
      localStorage.setItem("routines", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addRoutine = useCallback(() => {
    const name = newRoutine.trim();
    if (!name) return;

    const updated = [
      ...routines,
      { id: crypto.randomUUID(), name, completed: {} },
    ];
    persist(updated);
    setNewRoutine("");
  }, [newRoutine, routines, persist]);

  const deleteRoutine = useCallback((id) => {
    persist(routines.filter((r) => r.id !== id));
  }, [routines, persist]);

  // Attach stats to each routine
  const routineStats = useMemo(() => {
    const elapsed = daysElapsed();
    return routines.map((r) => {
      const done = week.filter((d) => r.completed?.[d.key]).length;
      // Divide by elapsed days — not 7 — so a perfect week shows 100%
      const percent = Math.round((done / elapsed) * 100);
      return { ...r, percent, done, elapsed };
    });
  }, [routines, week]);

  const todayKey = toDateKey(new Date());

  return {
    week,
    todayKey,
    routineStats,
    newRoutine,
    setNewRoutine,
    toggle,
    addRoutine,
    deleteRoutine,
  };
}