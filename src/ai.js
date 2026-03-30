// ================= AI COACH ENGINE =================
export const getAIInsight = ({
  goalPercent = 0,
  trend = 0,
  streak = 0,
  consistency = 0,
  todayValue = 0,
  heatmap = [],
  habits = []
}) => {

  const inactiveDays = heatmap.filter(d => d.value === 0).length;
  const weakConsistency = inactiveDays > heatmap.length * 0.4;

  let worstHabit = null;
  let worstRate = 0;

  habits.forEach(h => {
    const values = Object.values(h.completed || {});
    if (!values.length) return;

    const misses = values.filter(v => !v).length;
    const rate = misses / values.length;

    if (rate > worstRate) {
      worstRate = rate;
      worstHabit = h.name;
    }
  });

  if (goalPercent >= 90 && streak >= 5) {
    return "🔥 You're in a strong flow. Keep protecting your streak.";
  }

  if (trend < -20) {
    return "⚠️ Your activity dropped recently. Try restarting with a small task.";
  }

  if (weakConsistency) {
    return "📉 Your consistency is low. Focus on showing up daily, even for 10 mins.";
  }

  if (goalPercent < 40) {
    return "🎯 You're behind your goal. Start with a quick win now.";
  }

  if (streak > 0 && streak < 5) {
    return "⚡ You're building a streak. Don't break it today.";
  }

  if (worstHabit && worstRate > 0.5) {
    return `💡 You're often skipping "${worstHabit}". Try simplifying it.`;
  }

  return "🚀 Stay consistent. Momentum beats intensity.";
};


// ================= HABIT SUGGESTIONS =================
export const getHabitSuggestions = (items = []) => {

  const habits = items.filter(i => i.type === "habit");

  const suggestions = [];

  habits.forEach(h => {
    const values = Object.values(h.completed || {});
    if (!values.length) return;

    const misses = values.filter(v => !v).length;
    const rate = misses / values.length;

    if (rate > 0.6) {
      suggestions.push(`⚡ Reduce difficulty of "${h.name}"`);
    } else if (rate > 0.3) {
      suggestions.push(`📅 Fix time for "${h.name}"`);
    }
  });

  if (suggestions.length === 0) {
    return [
      "🚀 You're consistent. Increase difficulty slightly",
      "📈 Add a new habit carefully"
    ];
  }

  return suggestions.slice(0, 3);
};


// ==================================================
// 🔥 AI DIFF EXPLANATION ENGINE
// ==================================================

export const explainDiff = (diff = [], oldData = {}, newData = {}) => {

  if (!diff.length) {
    return "No major changes detected.";
  }

  let score = 0;

  diff.forEach(d => {
    if (d.includes("🆕")) score += 2;
    if (d.includes("❌")) score -= 2;
    if (d.includes("📈")) score += 1;
    if (d.includes("📉")) score -= 1;
    if (d.includes("📝")) score += 0.5;
  });

  const oldTasks = oldData.tasks || [];
  const newTasks = newData.tasks || [];

  if (newTasks.length > oldTasks.length) score += 1;
  if (newTasks.length < oldTasks.length) score -= 1;

  const oldLogs = Object.keys(oldData.logs || {}).length;
  const newLogs = Object.keys(newData.logs || {}).length;

  if (newLogs > oldLogs) score += 1;
  if (newLogs < oldLogs) score -= 1;

  if (score >= 3) {
    return "🚀 Great improvement! You added new actions and increased your activity.";
  }

  if (score >= 1) {
    return "📈 You're making progress. Small improvements are building momentum.";
  }

  if (score <= -3) {
    return "⚠️ Your progress dropped significantly.";
  }

  if (score < 0) {
    return "📉 Slight decline detected.";
  }

  return "⚖️ Your performance is stable.";
};


// ==================================================
// 🔥 AI FORECAST ENGINE
// ==================================================

export const predictPerformance = ({
  daily = {},
  goal = {},
  streak = 0,
  consistency = 0
}) => {

  const values = Object.values(daily);

  if (values.length < 3) {
    return "📊 Not enough data yet.";
  }

  const recent = values.slice(-3);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;

  const older = values.slice(-6, -3);
  const avgOld =
    older.length > 0
      ? older.reduce((a, b) => a + b, 0) / older.length
      : avgRecent;

  const trend = avgRecent - avgOld;
  const target = goal?.target || 0;

  if (avgRecent >= target && streak >= 3) {
    return "🚀 You're on track.";
  }

  if (trend > 5 && consistency > 0.6) {
    return "📈 Improving steadily.";
  }

  if (trend < -5) {
    return "⚠️ Performance declining.";
  }

  if (consistency < 0.4) {
    return "📉 Low consistency.";
  }

  return "📊 Stable progress.";
};


// ==================================================
// 🔥 ADAPTIVE GOAL ENGINE
// ==================================================

export const getAdaptiveGoal = ({
  daily = {},
  goal = {},
  streak = 0,
  consistency = 0
}) => {

  const values = Object.values(daily);
  const target = goal?.target || 0;

  if (!target || values.length < 3) return null;

  const recent = values.slice(-3);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;

  let suggestion = target;
  let message = "";

  if (avgRecent > target * 0.9 && consistency > 0.7) {
    suggestion = Math.round(target * 1.2);
    message = "🔥 Increase your goal.";
  } else if (avgRecent < target * 0.5 || consistency < 0.4) {
    suggestion = Math.round(target * 0.7);
    message = "⚠️ Reduce goal.";
  } else {
    return {
      suggestion: target,
      message: "📊 Goal is balanced.",
      change: "same"
    };
  }

  return {
    suggestion,
    message,
    change: suggestion > target ? "increase" : "decrease"
  };
};


// ==================================================
// 🏋️ WEIGHT AI ADVANCED
// ==================================================

export const detectPlateau = (weightLogs = []) => {
  if (weightLogs.length < 7) return null;

  const last7 = weightLogs.slice(-7);

  const changes = [];
  for (let i = 1; i < last7.length; i++) {
    changes.push(last7[i].weight - last7[i - 1].weight);
  }

  const avg =
    changes.reduce((a, b) => a + b, 0) / changes.length;

  if (Math.abs(avg) < 0.2) {
    return "⚠️ Plateau detected. No significant change.";
  }

  return null;
};

export const predictWeight = (weightLogs = []) => {
  if (weightLogs.length < 5) return null;

  const last = weightLogs.slice(-5);

  const changes = [];
  for (let i = 1; i < last.length; i++) {
    changes.push(last[i].weight - last[i - 1].weight);
  }

  const avg =
    changes.reduce((a, b) => a + b, 0) / changes.length;

  const current = last[last.length - 1].weight;

  const predicted = current + avg * 7;

  return `📉 Estimated in 7 days: ${predicted.toFixed(1)} kg`;
};

export const getWeightAdvice = (weightLogs = [], goal) => {
  if (!weightLogs.length) return null;

  const current = weightLogs[weightLogs.length - 1].weight;

  if (!goal) return "🎯 Set a goal.";

  if (current > goal) {
    return "🔥 Increase activity + reduce calories.";
  }

  return "🏆 Maintain your current routine.";
};


// ==================================================
// 🔥 HABIT ↔ WEIGHT CONNECTION AI (NEW)
// ==================================================

export const analyzeWeightWithHabits = ({
  weightLogs = [],
  habits = []
}) => {

  if (!weightLogs.length || !habits.length) return null;

  const last5 = weightLogs.slice(-5);
  if (last5.length < 5) return null;

  const changes = [];
  for (let i = 1; i < last5.length; i++) {
    changes.push(last5[i].weight - last5[i - 1].weight);
  }

  const avgChange =
    changes.reduce((a, b) => a + b, 0) / changes.length;

  let worstHabit = null;
  let worstRate = 0;

  habits.forEach(h => {
    const values = Object.values(h.completed || {});
    if (!values.length) return;

    const misses = values.filter(v => !v).length;
    const rate = misses / values.length;

    if (rate > worstRate) {
      worstRate = rate;
      worstHabit = h.name;
    }
  });

  if (avgChange >= -0.1) {
    if (worstHabit && worstRate > 0.4) {
      return `⚠️ Weight not improving. "${worstHabit}" is inconsistent. Fix this habit.`;
    }
    return "⚠️ Weight not improving. Improve consistency.";
  }

  if (avgChange < -0.1 && worstHabit) {
    return `🔥 Good progress! Keep maintaining "${worstHabit}".`;
  }

  return "📊 Stable progress.";
};


// ==================================================
// 🧠 UNIFIED AI COACH (ONE BRAIN)
// ==================================================

export const getUnifiedAI = ({
  habits = [],
  tasks = [],
  weightLogs = [],
  goal = {},
  streak = 0,
  consistency = 0
}) => {

  let messages = [];

  // ================= HABITS =================
  let worstHabit = null;
  let worstRate = 0;

  habits.forEach(h => {
    const values = Object.values(h.completed || {});
    if (!values.length) return;

    const misses = values.filter(v => !v).length;
    const rate = misses / values.length;

    if (rate > worstRate) {
      worstRate = rate;
      worstHabit = h.name;
    }
  });

  if (worstHabit && worstRate > 0.5) {
    messages.push(`⚠️ Habit issue: "${worstHabit}" needs attention.`);
  }

  // ================= TASKS =================
  const totalTaskLogs = tasks.reduce((acc, t) => acc + (t.logs?.length || 0), 0);

  if (totalTaskLogs < 3) {
    messages.push("📉 Low task activity. Increase focus time.");
  }

  // ================= WEIGHT =================
  if (weightLogs.length >= 5) {
    const last = weightLogs.slice(-5);

    const changes = [];
    for (let i = 1; i < last.length; i++) {
      changes.push(last[i].weight - last[i - 1].weight);
    }

    const avg =
      changes.reduce((a, b) => a + b, 0) / changes.length;

    if (avg >= -0.1) {
      messages.push("⚠️ Weight not improving. Adjust habits.");
    } else {
      messages.push("🔥 Weight trend improving.");
    }
  }

  // ================= STREAK =================
  if (streak >= 5) {
    messages.push("🔥 Strong streak. Keep it alive.");
  } else if (streak === 0) {
    messages.push("⚡ Start your streak today.");
  }

  // ================= CONSISTENCY =================
  if (consistency < 0.4) {
    messages.push("📉 Low consistency. Focus on daily execution.");
  }

  // ================= FINAL DECISION =================

  if (messages.length === 0) {
    return "🚀 You're doing great. Maintain your momentum.";
  }

  // prioritize most important
  return messages.slice(0, 2).join(" ");
};