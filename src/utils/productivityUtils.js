/**
 * productivityUtils.js
 * Pure domain utility functions for productivity data.
 * No side effects, no API calls, no imports.
 * Safe to use in hooks, components, and dashboard intelligence.
 */

// ─── Habit Helpers ──────────────────────────────────────────

/**
 * Returns completion stats for a single habit.
 * @returns {{ total, misses, missRate } | null}
 */
export const getHabitStats = (habit) => {
  if (!habit?.completed) return null;

  const values = Object.values(habit.completed);
  if (!values.length) return null;

  const misses  = values.filter((v) => !v).length;
  const missRate = misses / values.length;

  return {
    total: values.length,
    misses,
    missRate,                            // 0–1, higher = worse
    completionRate: 1 - missRate,        // 0–1, higher = better
  };
};

/**
 * Finds the habit with the highest miss rate.
 */
export const getWorstHabit = (habits = []) => {
  if (!Array.isArray(habits) || !habits.length) {
    return { worstHabit: null, worstMissRate: 0 };
  }

  let worstHabit   = null;
  let worstMissRate = 0;

  for (const h of habits) {
    const stats = getHabitStats(h);
    if (!stats) continue;

    if (stats.missRate > worstMissRate) {
      worstMissRate = stats.missRate;
      worstHabit    = h?.name ?? "Unknown";
    }
  }

  return { worstHabit, worstMissRate };
};

// ─── Smart Goal ─────────────────────────────────────────────

/**
 * Parses a natural language goal string into structured data.
 * e.g. "Read 30 pages" → { target: 30, unit: "pages", displayUnit: "pages" }
 * e.g. "Exercise 2 hours" → { target: 120, unit: "minutes", displayUnit: "hours" }
 */
export const parseSmartGoal = (goal) => {
  if (!goal || typeof goal !== "string") return null;

  const numMatch = goal.match(/\d+(\.\d+)?/);
  const value    = numMatch ? Number(numMatch[0]) : null;
  const lower    = goal.toLowerCase();

  // Determine storage unit and display unit separately
  let unit        = "count";
  let displayUnit = "count";
  let target      = value ?? 0;

  if (lower.includes("hour") || lower.includes("hr")) {
    unit        = "minutes";
    displayUnit = "hours";
    target      = (value ?? 0) * 60;   // store as minutes
  } else if (lower.includes("min")) {
    unit        = "minutes";
    displayUnit = "minutes";
  } else if (lower.includes("cal")) {
    unit        = "calories";
    displayUnit = "calories";
  } else if (lower.includes("page")) {
    unit        = "pages";
    displayUnit = "pages";
  } else if (lower.includes("km") || lower.includes("kilometer")) {
    unit        = "km";
    displayUnit = "km";
  }

  return { target, unit, displayUnit };
};

/**
 * Calculates completion percentage, capped at 100.
 */
export const calculatePercent = (value, target) => {
  if (!target || target <= 0) return 0;
  return Math.min(Math.round((Number(value ?? 0) / target) * 100), 100);
};

// ─── Daily Aggregation ──────────────────────────────────────

/**
 * Aggregates logs and task durations into a daily map.
 * All durations stored as MINUTES.
 * @returns {{ [dateString]: number }}
 */
export const getDailyData = (logs = {}, tasks = []) => {
  const daily = {};

  // Habit/goal logs
  Object.values(logs ?? {})
    .flat()
    .forEach((l) => {
      if (!l?.date) return;
      const val = Number(l.value ?? 0);
      daily[l.date] = (daily[l.date] ?? 0) + (isNaN(val) ? 0 : val);
    });

  // Task durations — input is seconds, stored as minutes
  (tasks ?? []).forEach((t) => {
    (t.logs ?? []).forEach((log) => {
      if (!log?.date) return;
      const minutes = Math.round((Number(log.duration) ?? 0) / 60);
      daily[log.date] = (daily[log.date] ?? 0) + minutes;
    });
  });

  return daily;
};

// ─── Heatmap ────────────────────────────────────────────────

/**
 * Returns 30-day heatmap array from daily data map.
 * Index 0 = 29 days ago, index 29 = today.
 */
export const getHeatmapData = (daily = {}) => {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toDateString();
    return { date: dateStr, value: Number(daily[dateStr] ?? 0) };
  });
};

// ─── Streak ─────────────────────────────────────────────────

/**
 * Calculates current streak from heatmap data.
 * Counts consecutive days with value > 0 going backwards from today.
 */
export const getStreak = (data = []) => {
  if (!Array.isArray(data)) return 0;

  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if ((data[i]?.value ?? 0) > 0) streak++;
    else break;
  }
  return streak;
};

// ─── Consistency ────────────────────────────────────────────

/**
 * Returns percentage of active days in heatmap (0–100).
 */
export const getConsistencyScore = (heatmap = []) => {
  if (!Array.isArray(heatmap) || !heatmap.length) return 0;
  const activeDays = heatmap.filter((d) => (d?.value ?? 0) > 0).length;
  return Math.round((activeDays / heatmap.length) * 100);
};

// ─── Weekly ─────────────────────────────────────────────────

/**
 * Returns last 7 days of activity from daily map.
 * Index 0 = 6 days ago, index 6 = today.
 */
export const getWeeklyData = (daily = {}) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    return { date: key, value: daily[key] ?? 0 };
  });
};

// ─── Task Breakdown ─────────────────────────────────────────

/**
 * Aggregates task time logs into chart-ready data.
 * Input: task.logs[].duration in SECONDS
 * Output: minutes per task name
 */
export const getTaskBreakdown = (tasks = []) => {
  const map = {};

  (tasks ?? []).forEach((task) => {
    const name = task?.title ?? "Untitled Task";
    const totalMinutes = (task.logs ?? []).reduce(
      (sum, log) => sum + Math.round((Number(log.duration) ?? 0) / 60),
      0
    );
    map[name] = (map[name] ?? 0) + totalMinutes;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value, unit: "min" }))
    .filter((entry) => entry.value > 0)      // exclude zero-time tasks
    .sort((a, b) => b.value - a.value);      // highest first
};