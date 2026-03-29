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

// ================= WEEKLY =================
export const getWeeklyData = (daily) => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));

    return {
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: daily[d.toDateString()] || 0
    };
  });
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

// ================= TASK BREAKDOWN =================
export const getTaskBreakdown = (tasks = []) => {
  const totals = {};

  tasks.forEach((t) => {
    t.logs?.forEach((log) => {
      const minutes = Math.round((log.duration || 0) / 60);

      if (!totals[t.name]) totals[t.name] = 0;
      totals[t.name] += minutes;
    });
  });

  return Object.keys(totals)
    .map(name => ({ name, value: totals[name] }))
    .sort((a, b) => b.value - a.value);
};