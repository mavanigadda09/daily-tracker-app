const normalize = (value) => String(value || "").toLowerCase();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// ===== PARSE WEIGHT =====
const parseWeightLogs = (weightLogs = []) =>
  weightLogs
    .map((entry) => {
      const dateValue = entry?.date ? new Date(entry.date).getTime() : Number.NaN;
      const weightValue = Number(entry?.weight);

      if (!Number.isFinite(dateValue) || !Number.isFinite(weightValue)) return null;

      return {
        date: entry.date,
        dateMs: dateValue,
        weight: weightValue
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dateMs - b.dateMs);

// ===== WEIGHT TREND =====
const getWeightSlopePerDay = (logs = []) => {
  if (logs.length < 2) return 0;

  const firstDay = logs[0].dateMs;
  const points = logs.map((e) => ({
    x: (e.dateMs - firstDay) / DAY_IN_MS,
    y: e.weight
  }));

  const n = points.length;
  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;

  return (n * sumXY - sumX * sumY) / denom;
};

// ===== WEIGHT ANALYSIS =====
export const analyzeWeightTrend = (weightLogs = []) => {
  const logs = parseWeightLogs(weightLogs);

  if (logs.length < 3) {
    return {
      trend: "insufficient",
      message: "Log weight consistently (3+ entries) to unlock trend insights."
    };
  }

  const slope = getWeightSlopePerDay(logs);

  if (slope > 0.05) return { trend: "up", message: "📈 Your weight is increasing." };
  if (slope < -0.05) return { trend: "down", message: "📉 Your weight is decreasing." };

  return { trend: "stable", message: "⚖️ Your weight is stable." };
};

// ===== PREDICTION =====
export const predictWeight = (weightLogs = [], days = 7) => {
  const logs = parseWeightLogs(weightLogs);
  if (!logs.length) return [];

  const slope = getWeightSlopePerDay(logs);
  const last = logs[logs.length - 1];

  return Array.from({ length: days }, (_, i) => ({
    date: new Date(last.dateMs + DAY_IN_MS * (i + 1)).toISOString().slice(0, 10),
    weight: Number((last.weight + slope * (i + 1)).toFixed(1))
  }));
};

// ===== HABITS =====
const getHabitInsight = (habits = []) => {
  if (!habits.length) return "Start tracking habits to build consistency.";

  let weakest = null;

  habits.forEach((h) => {
    const values = Object.values(h.completed || {});
    if (!values.length) return;

    const rate = values.filter(Boolean).length / values.length;

    if (!weakest || rate < weakest.rate) {
      weakest = { name: h.name, rate };
    }
  });

  if (!weakest) return "Your habit system looks stable.";

  if (weakest.rate < 0.5) {
    return `⚠️ You're inconsistent with "${weakest.name}". Simplify it (2-min rule).`;
  }

  return `✅ "${weakest.name}" is improving. Keep going.`;
};

// ===== TASKS =====
const getTaskInsight = (tasks = []) => {
  if (!tasks.length) return "Add at least one meaningful task today.";

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;

  if (done === 0) return "⚠️ No tasks completed yet. Start small.";

  const ratio = done / total;

  if (ratio < 0.5) {
    return `⚠️ Only ${done}/${total} tasks done. Focus on finishing.`;
  }

  return `✅ Strong execution: ${done}/${total} tasks completed.`;
};

// ===== FINANCE =====
const getFinanceInsight = (data = []) => {
  if (!data.length) return "Track your spending for better insights.";

  let income = 0;
  let expense = 0;

  data.forEach((e) => {
    const amt = Number(e.amount || 0);
    if (amt >= 0) income += amt;
    else expense += Math.abs(amt);
  });

  const diff = income - expense;

  if (diff < 0) {
    return `⚠️ Overspending by ${Math.abs(diff)}. Reduce non-essential expenses.`;
  }

  return `💰 You saved ${diff}. Consider investing a portion.`;
};

// ===== WEIGHT INSIGHT =====
const getWeightInsight = (logs = []) => {
  const parsed = parseWeightLogs(logs);
  if (!parsed.length) return "No weight data available.";

  const trend = analyzeWeightTrend(parsed);
  const prediction = predictWeight(parsed, 7);
  const next = prediction.at(-1)?.weight;

  return `${trend.message} Projected: ${next} kg in 7 days.`;
};

// ===== PROMPTS =====
export const getSuggestionPrompts = () => [
  "What should I improve today?",
  "Analyze my habits",
  "How is my weight trend?",
  "Am I overspending?",
  "Give me a weekly plan"
];

// ===== MAIN AI =====
export const generateAIResponse = async (input, context = {}) => {
  const text = normalize(input);

  const {
    habits = [],
    tasks = [],
    weightLogs = [],
    financeData = [],
    module = "general"
  } = context;

  const responses = [];

  if (text.includes("habit") || module === "habits") {
    responses.push(getHabitInsight(habits));
  }

  if (text.includes("task") || text.includes("focus")) {
    responses.push(getTaskInsight(tasks));
  }

  if (text.includes("weight") || module === "health") {
    responses.push(getWeightInsight(weightLogs));
  }

  if (text.includes("finance") || text.includes("money")) {
    responses.push(getFinanceInsight(financeData));
  }

  // 🔥 SMART DEFAULT
  if (!responses.length) {
    responses.push(getHabitInsight(habits));
    responses.push(getTaskInsight(tasks));
  }

  await new Promise((r) => setTimeout(r, 400));

  return "🤖 " + responses.slice(0, 2).join(" ");
};