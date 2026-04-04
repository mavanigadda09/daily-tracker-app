import { getWorstHabit } from "./utils";

// ================= AI INSIGHT =================

export const getAIInsight = ({
  goalPercent = 0,
  trend = 0,
  streak = 0,
  consistency = 0,
  heatmap = [],
  habits = []
}) => {

  const inactiveDays = heatmap.filter(d => d.value === 0).length;
  const weakConsistency = inactiveDays > heatmap.length * 0.4;

  const { worstHabit, worstRate } = getWorstHabit(habits);

  if (goalPercent >= 90 && streak >= 5) {
    return "🔥 You're in a strong flow. Keep protecting your streak.";
  }

  if (trend < -20) {
    return "⚠️ Your activity dropped recently. Try restarting small.";
  }

  if (weakConsistency) {
    return "📉 Your consistency is low. Focus on showing up daily.";
  }

  if (goalPercent < 40) {
    return "🎯 You're behind your goal. Start with a quick win.";
  }

  if (streak > 0 && streak < 5) {
    return "⚡ You're building a streak. Don't break it.";
  }

  if (worstHabit && worstRate > 0.5) {
    return `💡 You're skipping "${worstHabit}". Simplify it.`;
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


// ================= UNIFIED AI =================

export const getUnifiedAI = ({
  habits = [],
  tasks = [],
  weightLogs = [],
  streak = 0,
  consistency = 0
}) => {

  const messages = [];

  const { worstHabit, worstRate } = getWorstHabit(habits);

  if (worstHabit && worstRate > 0.5) {
    messages.push(`⚠️ Habit issue: "${worstHabit}" needs attention.`);
  }

  const totalTaskLogs = tasks.reduce(
    (acc, t) => acc + (t.logs?.length || 0),
    0
  );

  if (totalTaskLogs < 3) {
    messages.push("📉 Low task activity. Increase focus.");
  }

  if (weightLogs.length >= 5) {
    const last = weightLogs.slice(-5);

    const changes = [];
    for (let i = 1; i < last.length; i++) {
      changes.push(last[i].weight - last[i - 1].weight);
    }

    const avg =
      changes.reduce((a, b) => a + b, 0) / changes.length;

    if (avg >= -0.1) {
      messages.push("⚠️ Weight not improving.");
    } else {
      messages.push("🔥 Weight improving.");
    }
  }

  if (streak >= 5) {
    messages.push("🔥 Strong streak. Keep it alive.");
  } else if (streak === 0) {
    messages.push("⚡ Start your streak today.");
  }

  if (consistency < 40) {
    messages.push("📉 Low consistency. Focus daily.");
  }

  if (messages.length === 0) {
    return "🚀 You're doing great. Maintain momentum.";
  }

  return messages.slice(0, 2).join(" ");
};