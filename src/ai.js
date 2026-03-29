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
    return "🚀 Great improvement! You added new actions and increased your activity. Keep it going!";
  }

  if (score >= 1) {
    return "📈 You're making progress. Small improvements are building momentum.";
  }

  if (score <= -3) {
    return "⚠️ Your progress dropped significantly. Try restarting with smaller, manageable steps.";
  }

  if (score < 0) {
    return "📉 Slight decline detected. Stay consistent and avoid skipping tasks.";
  }

  return "⚖️ Your performance is stable. Try pushing slightly harder for growth.";
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
    return "📊 Not enough data yet. Keep tracking to unlock predictions.";
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
    return "🚀 You're on track to consistently hit your goal.";
  }

  if (trend > 5 && consistency > 0.6) {
    return "📈 Your performance is improving steadily.";
  }

  if (trend < -5) {
    return "⚠️ Your performance is declining.";
  }

  if (consistency < 0.4) {
    return "📉 Low consistency detected.";
  }

  if (avgRecent < target * 0.5) {
    return "⚠️ You're far from your goal.";
  }

  return "📊 Your progress is stable.";
};


// ==================================================
// 🔥 NEW: ADAPTIVE GOAL ENGINE
// ==================================================

export const getAdaptiveGoal = ({
  daily = {},
  goal = {},
  streak = 0,
  consistency = 0
}) => {

  const values = Object.values(daily);
  const target = goal?.target || 0;

  if (!target || values.length < 3) {
    return null;
  }

  const recent = values.slice(-3);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;

  let suggestion = target;
  let message = "";

  // 🔼 performing well → increase
  if (avgRecent > target * 0.9 && consistency > 0.7) {
    suggestion = Math.round(target * 1.2);
    message = "🔥 You're exceeding your goal. Increase challenge slightly.";
  }

  // 🔽 struggling → reduce
  else if (avgRecent < target * 0.5 || consistency < 0.4) {
    suggestion = Math.round(target * 0.7);
    message = "⚠️ You're struggling. Reduce goal to rebuild consistency.";
  }

  // ⚖️ stable
  else {
    return {
      suggestion: target,
      message: "📊 Your goal is well balanced. Keep it as is.",
      change: "same"
    };
  }

  return {
    suggestion,
    message,
    change: suggestion > target ? "increase" : "decrease"
  };
};