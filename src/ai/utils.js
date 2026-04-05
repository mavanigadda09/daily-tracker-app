// ================= HABIT HELPERS =================

export const getHabitStats = (habit) => {
  if (!habit?.completed) return null;

  const values = Object.values(habit.completed);
  if (!values.length) return null;

  const misses = values.filter(v => !v).length;
  const rate = values.length ? misses / values.length : 0;

  return {
    total: values.length,
    misses,
    rate
  };
};

export const getWorstHabit = (habits = []) => {
  if (!Array.isArray(habits) || !habits.length) {
    return { worstHabit: null, worstRate: 0 };
  }

  let worstHabit = null;
  let worstRate = 0;

  for (const h of habits) {
    const stats = getHabitStats(h);
    if (!stats) continue;

    if (stats.rate > worstRate) {
      worstRate = stats.rate;
      worstHabit = h?.name || "Unknown";
    }
  }

  return { worstHabit, worstRate };
};

// ================= SMART GOAL =================

export const parseSmartGoal = (goal) => {
  if (!goal || typeof goal !== "string") return null;

  const numMatch = goal.match(/\d+/);
  const value = numMatch ? Number(numMatch[0]) : null;

  const lower = goal.toLowerCase();

  let unit = "count";

  if (lower.includes("hour") || lower.includes("hr")) {
    unit = "minutes";
  } else if (lower.includes("min")) {
    unit = "minutes";
  } else if (lower.includes("cal")) {
    unit = "calories";
  } else if (lower.includes("page")) {
    unit = "pages";
  }

  let target = value;

  if (unit === "minutes" && lower.includes("hour") && value) {
    target = value * 60;
  }

  return {
    target: target || 0,
    unit
  };
};

export const calculatePercent = (value, target) => {
  if (!target || target <= 0) return 0;

  const percent = (Number(value || 0) / target) * 100;

  return Math.min(Math.round(percent), 100);
};

// ================= DAILY =================

export const getDailyData = (logs = {}, tasks = []) => {
  const daily = {};

  // Logs
  Object.values(logs || {}).flat().forEach((l) => {
    if (!l?.date) return;

    const val = Number(l.value || 0);
    if (!daily[l.date]) daily[l.date] = 0;

    daily[l.date] += isNaN(val) ? 0 : val;
  });

  // Task durations
  (tasks || []).forEach((t) => {
    (t.logs || []).forEach((log) => {
      if (!log?.date) return;

      const minutes = Math.round((Number(log.duration) || 0) / 60);

      if (!daily[log.date]) daily[log.date] = 0;
      daily[log.date] += minutes;
    });
  });

  return daily;
};

// ================= HEATMAP =================

export const getHeatmapData = (daily = {}) => {
  return Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));

    const dateStr = d.toDateString();

    return {
      date: dateStr,
      value: Number(daily[dateStr] || 0)
    };
  });
};

// ================= STREAK =================

export const getStreak = (data = []) => {
  if (!Array.isArray(data)) return 0;

  let streak = 0;

  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i]?.value > 0) streak++;
    else break;
  }

  return streak;
};

// ================= CONSISTENCY =================

export const getConsistencyScore = (heatmap = []) => {
  if (!Array.isArray(heatmap) || !heatmap.length) return 0;

  const activeDays = heatmap.filter(d => d?.value > 0).length;

  return Math.round((activeDays / heatmap.length) * 100);
};

// ================= WEEKLY =================

export const getWeeklyData = (daily = {}) => {
  const result = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));

    const key = d.toDateString();

    result.push({
      date: key,
      value: daily[key] || 0
    });
  }

  return result;
};

// ================= TASK BREAKDOWN =================

export const getTaskBreakdown = (tasks = []) => {
  const map = {};

  tasks.forEach((task) => {
    const name = task?.title || "Task";

    const total = (task.logs || []).reduce((sum, log) => {
      return sum + Math.round((log.duration || 0) / 60);
    }, 0);

    map[name] = (map[name] || 0) + total;
  });

  return Object.entries(map).map(([name, value]) => ({
    name,
    value
  }));
};