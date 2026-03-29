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

  // ================= HEATMAP ANALYSIS =================
  const inactiveDays = heatmap.filter(d => d.value === 0).length;

  const weakConsistency = inactiveDays > heatmap.length * 0.4;

  // ================= HABIT FAILURE =================
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

  // ================= DECISION ENGINE =================

  // 🔥 peak
  if (goalPercent >= 90 && streak >= 5) {
    return "🔥 You're in a strong flow. Keep protecting your streak.";
  }

  // 📉 drop detected
  if (trend < -20) {
    return "⚠️ Your activity dropped recently. Try restarting with a small task.";
  }

  // 🧠 consistency issue
  if (weakConsistency) {
    return "📉 Your consistency is low. Focus on showing up daily, even for 10 mins.";
  }

  // 🎯 goal focus
  if (goalPercent < 40) {
    return "🎯 You're behind your goal. Start with a quick win now.";
  }

  // 🔁 streak build
  if (streak > 0 && streak < 5) {
    return "⚡ You're building a streak. Don't break it today.";
  }

  // 🧠 habit issue
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