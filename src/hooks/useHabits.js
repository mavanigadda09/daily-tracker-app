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

// ─── Time Intelligence (NEW) ────────────────────────────────

const getTimeStatus = (time) => {
  if (!time) return null;

  const now = new Date();
  const [h, m] = time.split(":").map(Number);

  const target = new Date();
  target.setHours(h, m, 0, 0);

  const diff = target - now;
  const minutes = diff / (1000 * 60);

  if (minutes > 0 && minutes <= 60) return "soon";
  if (minutes < 0 && minutes >= -60) return "missed";
  if (minutes < -60) return "overdue";

  return "normal";
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
  // 🧠 ENRICH HABITS (UPGRADED INTELLIGENCE LAYER)
  // ─────────────────────────────────────────────────────────

  const enrichedHabits = useMemo(() => {
    const weekKeys = getLastNDays(7);

    return habits.map((h) => {
      const completed = h.completed || {};

      // Weekly progress %
      const weekDone = weekKeys.filter((k) => completed[k]?.done).length;
      const weekProgress = Math.round((weekDone / 7) * 100);

      // Done today
      const doneToday = !!completed[todayKey]?.done;

      // Time intelligence
      const timeStatus = getTimeStatus(h.time);

      // Consistency (last 7 days ratio)
      const consistency = weekDone / 7;

      // Habit age (days since created)
      const ageDays = h.createdAt
        ? Math.floor((Date.now() - h.createdAt) / (1000 * 60 * 60 * 24))
        : 0;

      // Priority scoring (UPGRADED)
      let priorityScore = 0;

      if (!doneToday) priorityScore += 50;

      if (timeStatus === "overdue") priorityScore += 40;
      else if (timeStatus === "missed") priorityScore += 30;
      else if (timeStatus === "soon") priorityScore += 20;

      if (h.streak >= 5) priorityScore += 25;
      else if (h.streak >= 3) priorityScore += 15;

      if (consistency < 0.4) priorityScore += 20;

      if (ageDays < 3) priorityScore += 10; // new habit boost

      return {
        ...h,
        doneToday,
        weekProgress,
        priorityScore,

        // 🆕 NEW FIELDS (non-breaking)
        timeStatus,
        consistency,
        ageDays,
      };
    });
  }, [habits, todayKey]);

  // ─────────────────────────────────────────────────────────
  // 📊 PARTITION BY VIEW (SMART SORTING)
  // ─────────────────────────────────────────────────────────

  const getPartitionedHabits = useCallback(
    (view) => {
      if (view === "day") {
        const pending = enrichedHabits
          .filter((h) => !h.doneToday)
          .sort((a, b) => {
            // 🚨 Hard priority rules
            if (a.timeStatus === "overdue" && b.timeStatus !== "overdue")
              return -1;
            if (b.timeStatus === "overdue" && a.timeStatus !== "overdue")
              return 1;

            if (a.timeStatus === "soon" && b.timeStatus !== "soon") return -1;
            if (b.timeStatus === "soon" && a.timeStatus !== "soon") return 1;

            // fallback to score
            return b.priorityScore - a.priorityScore;
          });

        const completed = enrichedHabits.filter((h) => h.doneToday);

        return { pending, completed };
      }

      if (view === "week") {
        return {
          pending: enrichedHabits,
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
  // 🔄 ACTIONS (UNCHANGED — SAFE)
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
    getPartitionedHabits,
  };
}