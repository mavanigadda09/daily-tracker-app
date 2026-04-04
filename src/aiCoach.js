// ================= HELPERS =================

const normalize = (value) => String(value || "").toLowerCase();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// ================= WEIGHT =================

const parseWeightLogs = (weightLogs = []) =>
  weightLogs
    .map((entry) => {
      const dateMs = entry?.date ? new Date(entry.date).getTime() : NaN;
      const weight = Number(entry?.weight);

      if (!Number.isFinite(dateMs) || !Number.isFinite(weight)) return null;

      return { date: entry.date, dateMs, weight };
    })
    .filter(Boolean)
    .sort((a, b) => a.dateMs - b.dateMs);

const getWeightSlopePerDay = (logs = []) => {
  if (logs.length < 2) return 0;

  const first = logs[0].dateMs;

  const points = logs.map((e) => ({
    x: (e.dateMs - first) / DAY_IN_MS,
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

// ================= HABITS =================

const getHabitInsight = (habits = []) => {
  if (!habits.length) return "Start tracking habits.";

  let weakest = null;

  habits.forEach((h) => {
    const values = Object.values(h.completed || {});
    if (!values.length) return;

    const rate = values.filter(Boolean).length / values.length;

    if (!weakest || rate < weakest.rate) {
      weakest = { name: h.name, rate };
    }
  });

  if (!weakest) return "Your habits look stable.";

  if (weakest.rate < 0.5) {
    return `⚠️ You're inconsistent with "${weakest.name}".`;
  }

  return `✅ "${weakest.name}" improving.`;
};

// ================= TASKS =================

const getTaskInsight = (tasks = []) => {
  if (!tasks.length) return "Add at least one task.";

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;

  if (done === 0) return "⚠️ No tasks completed.";

  if (done < total / 2) {
    return `⚠️ Only ${done}/${total} tasks done.`;
  }

  return `✅ ${done}/${total} tasks completed.`;
};

// ================= EXPENSE =================

const extractExpense = (input) => {
  const text = input.toLowerCase();

  const amountMatch = text.match(
    /(?:₹|rs|rupees?|\$)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i
  );

  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (!amount || amount <= 0) return null;

  const isIncome = /\b(earned|income|salary|received)\b/i.test(text);

  const type = isIncome ? "income" : "expense";

  let category = "Other";

  if (/food|eat|lunch|dinner/.test(text)) category = "Food";
  else if (/travel|uber|taxi|bus/.test(text)) category = "Travel";
  else if (/shopping|buy|amazon/.test(text)) category = "Shopping";
  else if (/health|gym/.test(text)) category = "Health";

  return {
    amount,
    type,
    category,
    note: input
  };
};

// ================= WEIGHT GOAL =================

const getWeightGoalPlan = (text) => {
  const match = text.match(/(\d+)\s*kg/g);
  if (!match || match.length < 2) return null;

  const [current, target] = match.map((v) =>
    Number(v.replace("kg", ""))
  );

  const loss = current - target;
  const weekly = loss / 24;

  return `🎯 ${current}kg → ${target}kg
📉 ${weekly.toFixed(2)} kg/week
💪 Stay consistent`;
};

// ================= PROMPTS =================

export const getSuggestionPrompts = () => [
  "What should I improve today?",
  "Analyze my habits",
  "Add habit: drink water",
  "Add task: go to gym",
  "How is my weight trend?",
  "I spent 250 on lunch"
];

// ================= MAIN AI =================

export const generateAIResponse = async (input, context = {}) => {
  const text = normalize(input);

  const {
    habits = [],
    tasks = []
  } = context;

  // ===== EXPENSE =====
  if (
    text.includes("spent") ||
    text.includes("earned") ||
    text.includes("income")
  ) {
    const transaction = extractExpense(input);

    if (transaction) {
      return {
        type: "add_expense",
        payload: transaction,
        message: `💸 ₹${transaction.amount} ${transaction.category}`
      };
    }

    return {
      type: "text",
      message: "Couldn't understand transaction."
    };
  }

  // ===== ADD HABIT =====
  if (text.startsWith("add habit")) {
    const name = input.replace(/add habit:?/i, "").trim();

    return {
      type: "add_habit",
      payload: { name },
      message: `✅ Habit "${name}" added`
    };
  }

  // ===== ADD TASK =====
  if (text.startsWith("add task")) {
    const name = input.replace(/add task:?/i, "").trim();

    return {
      type: "add_task",
      payload: { name },
      message: `✅ Task "${name}" added`
    };
  }

  // ===== WEIGHT GOAL =====
  const goal = getWeightGoalPlan(text);
  if (goal) {
    return {
      type: "text",
      message: "🤖 " + goal
    };
  }

  // ===== DEFAULT =====
  const response =
    getHabitInsight(habits) + " " + getTaskInsight(tasks);

  await new Promise((r) => setTimeout(r, 300));

  return {
    type: "text",
    message: "🤖 " + response
  };
};