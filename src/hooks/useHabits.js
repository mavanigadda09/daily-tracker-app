import { useCallback, useMemo } from "react";

// ─── Date utilities ─────────────────────────────────────────

export const getDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getLastNDays = (n) => {
  const days = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(getDateKey(d));
  }
  return days;
};

// ─── Streak calculation ─────────────────────────────────────

export function calcStreak(completed = {}) {
  let streak = 0;
  const cursor = new Date();

  if (!completed[getDateKey(cursor)]?.done) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = getDateKey(cursor);
    if (!completed[key]?.done) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    if (streak > 1095) break;
  }

  return streak;
}

// ─── Hook ───────────────────────────────────────────────────

export function useHabits(items, setItems) {
  const todayKey = getDateKey();

  const habits = useMemo(
    () => items.filter((i) => i.type === "habit"),
    [items]
  );

  // ─────────────────────────────────────────────────────────
  // 🧠 ENRICH HABITS (THIS IS THE BIG UPGRADE)
  // ─────────────────────────────────────────────────────────

  const enrichedHabits = useMemo(() => {
    const weekKeys = getLastNDays(7);

    return habits.map((h) => {
      const completed = h.completed || {};

      // Weekly progress %
      const weekDone = weekKeys.filter((k) => completed[k]?.done).length;
      const weekProgress = Math.round((weekDone / 7) * 100);

      // Is done today
      const doneToday = !!completed[todayKey]?.done;

      // Priority system
      const priorityScore =
        (doneToday ? 0 : 50) +
        (h.streak >= 3 ? 30 : 0) +
        (h.time ? 10 : 0);

      return {
        ...h,
        doneToday,
        weekProgress,
        priorityScore,
      };
    });
  }, [habits, todayKey]);

  // ─────────────────────────────────────────────────────────
  // 📊 PARTITION BY VIEW
  // ─────────────────────────────────────────────────────────

  const getPartitionedHabits = useCallback(
    (view) => {
      if (view === "day") {
        const pending = enrichedHabits
          .filter((h) => !h.doneToday)
          .sort((a, b) => b.priorityScore - a.priorityScore);

        const completed = enrichedHabits.filter((h) => h.doneToday);

        return { pending, completed };
      }

      if (view === "week") {
        return {
          pending: enrichedHabits, // show all
          completed: [],
        };
      }

      if (view === "month") {
        return {
          pending: enrichedHabits,
          completed: [],
        };
      }

      return { pending: [], completed: [] };
    },
    [enrichedHabits]
  );

  // ─────────────────────────────────────────────────────────
  // 🔄 ACTIONS
  // ─────────────────────────────────────────────────────────

  const toggleHabit = useCallback(
    (id) => {
      setItems((prev) =>
        prev.map((h) => {
          if (h.id !== id) return h;

          const alreadyDone = !!h.completed?.[todayKey]?.done;

          if (alreadyDone) {
            const { [todayKey]: _, ...rest } = h.completed || {};
            return {
              ...h,
              completed: rest,
              xp: Math.max(0, (h.xp || 0) - 10),
              streak: calcStreak(rest),
            };
          }

          const newCompleted = {
            ...(h.completed || {}),
            [todayKey]: { done: true, ts: Date.now() },
          };

          return {
            ...h,
            completed: newCompleted,
            xp: (h.xp || 0) + 10,
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
        prev.map((h) =>
          h.id === id ? { ...h, name: newName.trim() } : h
        )
      );
    },
    [setItems]
  );

  // ─────────────────────────────────────────────────────────

  return {
    habits: enrichedHabits,
    todayKey,
    toggleHabit,
    addHabit,
    deleteHabit,
    editHabit,
    getPartitionedHabits, // 🔥 NEW (IMPORTANT)
  };
}