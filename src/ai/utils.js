// ================= HABIT HELPERS =================

export const getHabitStats = (habit) => {
  const values = Object.values(habit.completed || {});
  if (!values.length) return null;

  const misses = values.filter(v => !v).length;
  const rate = misses / values.length;

  return {
    total: values.length,
    misses,
    rate
  };
};

export const getWorstHabit = (habits = []) => {
  let worstHabit = null;
  let worstRate = 0;

  habits.forEach(h => {
    const stats = getHabitStats(h);
    if (!stats) return;

    if (stats.rate > worstRate) {
      worstRate = stats.rate;
      worstHabit = h.name;
    }
  });

  return { worstHabit, worstRate };
};

// ================= SMART GOAL =================

export const parseSmartGoal = (goal) => {
  if (!goal) return null;

  const num = goal.match(/\d+/);
  const value = num ? Number(num[0]) : null;

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

  if (unit === "minutes" && lower.includes("hour")) {
    target = value * 60;
  }

  return { target, unit };
};

export const calculatePercent = (value, target) => {
  if (!target) return 0;
  return Math.min(Math.round((value / target) * 100), 100);
};

// ================= DAILY =================

export const getDailyData = (logs = {}, tasks = []) => {
  const daily = {};

  Object.values(logs).flat().forEach((l) => {
    if (!l?.date) return;
    if (!daily[l.date]) daily[l.date] = 0;
    daily[l.date] += Number(l.value || 0);
  });

  tasks.forEach((t) => {
    t.logs?.forEach((log) => {
      if (!log?.date) return;

      const minutes = Math.round((log.duration || 0) / 60);

      if (!daily[log.date]) daily[log.date] = 0;
      daily[log.date] += minutes;
    });
  });

  return daily;
};

// ================= HEATMAP =================

export const getHeatmapData = (daily) => {
  return Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));

    return {
      date: d.toDateString(),
      value: daily[d.toDateString()] || 0
    };
  });
};

// ================= STREAK =================

export const getStreak = (data) => {
  let streak = 0;

  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].value > 0) streak++;
    else break;
  }

  return streak;
};

// ================= CONSISTENCY =================

export const getConsistencyScore = (heatmap = []) => {
  if (!heatmap.length) return 0;

  const activeDays = heatmap.filter(d => d.value > 0).length;

  return Math.round((activeDays / heatmap.length) * 100);
};