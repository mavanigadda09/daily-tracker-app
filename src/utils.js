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

// ================= 🔥 NEW: HABIT STREAK =================
export const getHabitStreak = (items = []) => {
  const today = new Date();

  let streak = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = d.toDateString();

    const allDone = items.every(item => {
      if (item.type !== "habit") return true;
      return item.completed?.[key];
    });

    if (allDone) streak++;
    else break;
  }

  return streak;
};

// ================= 🔥 NEW: CONSISTENCY SCORE =================
export const getConsistencyScore = (heatmap = []) => {
  if (!heatmap.length) return 0;

  const activeDays = heatmap.filter(d => d.value > 0).length;

  return Math.round((activeDays / heatmap.length) * 100);
};

// ================= 🔥 NEW: MOTIVATION ENGINE =================
export const getMotivationMessage = ({
  streak = 0,
  consistency = 0
}) => {
  if (streak >= 7) {
    return "🔥 Incredible consistency! You're unstoppable!";
  }

  if (streak >= 3) {
    return "🚀 Great momentum! Keep pushing!";
  }

  if (streak === 0) {
    return "💡 Start today. Small steps build big habits.";
  }

  if (consistency > 70) {
    return "👏 You're doing amazing. Stay consistent!";
  }

  if (consistency < 30) {
    return "⚠️ Let’s get back on track. You got this!";
  }

  return "💪 Keep going. Progress takes time!";
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

// ==================================================
// 🔥 VERSION DIFF ENGINE
// ==================================================

export const compareVersions = (oldData = {}, newData = {}) => {
  const changes = [];

  const oldTasks = oldData.tasks || [];
  const newTasks = newData.tasks || [];

  const oldNames = oldTasks.map(t => t.name);
  const newNames = newTasks.map(t => t.name);

  newNames.forEach(name => {
    if (!oldNames.includes(name)) {
      changes.push(`🆕 Task added: "${name}"`);
    }
  });

  oldNames.forEach(name => {
    if (!newNames.includes(name)) {
      changes.push(`❌ Task removed: "${name}"`);
    }
  });

  if (oldData.goal !== newData.goal) {
    changes.push(`📈 Goal changed`);
  }

  if ((oldData.items || []).length !== (newData.items || []).length) {
    changes.push(`📊 Activities updated`);
  }

  if (
    Object.keys(oldData.logs || {}).length !==
    Object.keys(newData.logs || {}).length
  ) {
    changes.push(`📝 Progress logs updated`);
  }

  if (changes.length === 0) {
    changes.push("No major changes detected");
  }

  return changes;
};