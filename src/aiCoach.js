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
    return `⚠️ You're inconsistent with "${weakest.name}".`;
  }

  return `✅ "${weakest.name}" is improving.`;
};

// ===== TASKS =====
const getTaskInsight = (tasks = []) => {
  if (!tasks.length) return "Add at least one meaningful task today.";

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;

  if (done === 0) return "⚠️ No tasks completed yet.";

  if (done < total / 2) {
    return `⚠️ Only ${done}/${total} tasks done.`;
  }

  return `✅ ${done}/${total} tasks completed.`;
};

// ===== EXPENSE PARSER (NEW 🔥) =====
const extractExpense = (input) => {
  const text = input.toLowerCase();

  // match amount like 200, 200rs, 200 rupees
  const amountMatch = text.match(/(\d+)\s*(rs|rupees|₹)?/);
  if (!amountMatch) return null;

  const amount = Number(amountMatch[1]);

  // detect category
  let category = "General";
  if (text.includes("food") || text.includes("eat")) category = "Food";
  if (text.includes("travel") || text.includes("uber")) category = "Travel";
  if (text.includes("shopping")) category = "Shopping";

  // detect title
  let title = "Expense";
  if (category === "Food") title = "Food";
  if (category === "Travel") title = "Travel";
  if (category === "Shopping") title = "Shopping";

  return {
    title,
    amount,
    category,
    date: new Date().toISOString()
  };
};

// ===== WEIGHT GOAL =====
const getWeightGoalPlan = (text) => {
  const weightMatch = text.match(/(\d+)\s*kg/g);
  if (!weightMatch || weightMatch.length < 2) return null;

  const numbers = weightMatch.map(v => Number(v.replace("kg", "").trim()));

  const current = numbers[0];
  const target = numbers[1];

  const monthsMatch = text.match(/(\d+)\s*month/);
  const months = monthsMatch ? Number(monthsMatch[1]) : 6;

  const totalLoss = current - target;
  const weeklyLoss = totalLoss / (months * 4);

  let feasibility;

  if (weeklyLoss > 1.5) {
    feasibility = "⚠️ This goal is very aggressive.";
  } else if (weeklyLoss > 1) {
    feasibility = "⚠️ Challenging but possible.";
  } else {
    feasibility = "✅ Healthy goal.";
  }

  return [
    `🎯 Goal: ${current}kg → ${target}kg in ${months} months`,
    `📊 ${weeklyLoss.toFixed(2)} kg/week required`,
    feasibility,
    `\n📅 Plan:
• Walk 8–10k steps daily
• Calorie deficit (300–500 kcal)
• High protein diet
• Strength training 3x/week
• Sleep 7–8 hours`
  ].join("\n");
};

// ===== PROMPTS =====
export const getSuggestionPrompts = () => [
  "What should I improve today?",
  "Analyze my habits",
  "Add habit: drink water",
  "Add task: go to gym",
  "How is my weight trend?",
  "I spent 200 on food" // 👈 NEW suggestion
];

// ===== MAIN AI =====
export const generateAIResponse = async (input, context = {}) => {
  const text = normalize(input);

  const {
    habits = [],
    tasks = []
  } = context;

  // ===== ADD EXPENSE (NEW 🔥) =====
  if (text.includes("spent") || text.includes("expense")) {
    const expense = extractExpense(input);

    if (expense) {
      return {
        type: "add_expense",
        payload: expense,
        message: `💸 Expense added: ${expense.title} ₹${expense.amount}`
      };
    }
  }

  // ===== COMMAND: ADD HABIT =====
  if (text.startsWith("add habit")) {
    const name = input.replace(/add habit:?/i, "").trim();

    if (name) {
      return {
        type: "add_habit",
        payload: { name },
        message: `✅ Habit "${name}" added!`
      };
    }
  }

  // ===== COMMAND: ADD TASK =====
  if (text.startsWith("add task")) {
    const name = input.replace(/add task:?/i, "").trim();

    if (name) {
      return {
        type: "add_task",
        payload: { name },
        message: `✅ Task "${name}" added!`
      };
    }
  }

  // ===== WEIGHT GOAL =====
  const goalPlan = getWeightGoalPlan(text);
  if (goalPlan) {
    return {
      type: "text",
      message: "🤖 " + goalPlan
    };
  }

  // ===== DEFAULT =====
  const response =
    getHabitInsight(habits) + " " + getTaskInsight(tasks);

  await new Promise((r) => setTimeout(r, 400));

  return {
    type: "text",
    message: "🤖 " + response
  };
};