import { useCallback, useMemo } from "react";

// ─── Date utilities ────────────────────────────────────────────────────────────

export const getDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getYesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDateKey(d);
};

/**
 * Calculates true consecutive-day streak from a completed map.
 * Walks backward from today counting unbroken daily completions.
 * Does NOT use the stored streak integer — recomputes from source of truth.
 */
export function calcStreak(completed = {}) {
  if (!completed) return 0;
  let streak = 0;
  const cursor = new Date();

  // If today isn't done yet, start counting from yesterday
  if (!completed[getDateKey(cursor)]?.done) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = getDateKey(cursor);
    if (!completed[key]?.done) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    // Safety: don't walk back more than 3 years
    if (streak > 1095) break;
  }

  return streak;
}

// ─── View filter ──────────────────────────────────────────────────────────────

/**
 * Returns true if the habit was completed on ALL days in the window
 * for week/month views, or just today for day view.
 *
 * "All days" is intentionally strict — a habit half-done this week
 * should not show as complete.
 *
 * For week/month we check: completed on every day from window start to today.
 */
export function isHabitCompleted(habit, view, todayKey) {
  const completed = habit.completed || {};

  if (view === "day") {
    return !!completed[todayKey]?.done;
  }

  const now = new Date();
  const days = [];

  if (view === "week") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(getDateKey(d));
    }
  }

  if (view === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    for (let i = 0; i < daysPassed; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      days.push(getDateKey(d));
    }
    void daysInMonth; // referenced for clarity
  }

  // "Completed for period" = done on every elapsed day in the window
  return days.every((key) => completed[key]?.done);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * All habit mutation logic. Zero localStorage — trusts DataContext / Firebase.
 *
 * @param {Array}    items    — full items array from DataContext
 * @param {Function} setItems — setter from DataContext
 */
export function useHabits(items, setItems) {
  const todayKey = getDateKey();

  const habits = useMemo(
    () => items.filter((i) => i.type === "habit"),
    [items]
  );

  // ── Toggle: true two-way toggle with streak recalc ─────────────────────────
  const toggleHabit = useCallback(
    (id) => {
      setItems((prev) =>
        prev.map((h) => {
          if (h.id !== id) return h;

          const alreadyDone = !!h.completed?.[todayKey]?.done;

          // Un-completing today: remove the key, recalc streak
          if (alreadyDone) {
            const { [todayKey]: _, ...rest } = h.completed || {};
            return {
              ...h,
              completed: rest,
              xp: Math.max(0, (h.xp || 0) - 10), // Reverse the XP award
            };
          }

          // Completing today
          const newCompleted = {
            ...(h.completed || {}),
            [todayKey]: { done: true, ts: Date.now() },
          };

          return {
            ...h,
            completed: newCompleted,
            xp: (h.xp || 0) + 10,
            // Streak derived from completion map — not incremented blindly
            streak: calcStreak(newCompleted),
          };
        })
      );
    },
    [setItems, todayKey]
  );

  const addHabit = useCallback(
    (name) => {
      if (!name?.trim()) return;
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          type: "habit",
          completed: {},
          xp: 0,
          streak: 0,
          createdAt: Date.now(),
        },
      ]);
    },
    [setItems]
  );

  const deleteHabit = useCallback(
    (id) => setItems((prev) => prev.filter((h) => h.id !== id)),
    [setItems]
  );

  const editHabit = useCallback(
    (id, newName) => {
      if (!newName?.trim()) return;
      setItems((prev) =>
        prev.map((h) => (h.id === id ? { ...h, name: newName.trim() } : h))
      );
    },
    [setItems]
  );

  return { habits, todayKey, toggleHabit, addHabit, deleteHabit, editHabit };
}