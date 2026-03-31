const normalize = (value) => String(value || "").toLowerCase();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseWeightLogs = (weightLogs = []) =>
  weightLogs
    .map((entry) => {
      const dateValue = entry?.date ? new Date(entry.date).getTime() : Number.NaN;
      const weightValue = Number(entry?.weight);

      if (!Number.isFinite(dateValue) || !Number.isFinite(weightValue)) {
        return null;
      }

      return {
        date: entry.date,
        dateMs: dateValue,
        weight: weightValue
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dateMs - b.dateMs);

const getWeightSlopePerDay = (logs = []) => {
  if (logs.length < 2) return 0;

  const firstDay = logs[0].dateMs;
  const points = logs.map((entry) => ({
    x: (entry.dateMs - firstDay) / DAY_IN_MS,
    y: entry.weight
  }));

  const count = points.length;
  const sumX = points.reduce((acc, point) => acc + point.x, 0);
  const sumY = points.reduce((acc, point) => acc + point.y, 0);
  const sumXY = points.reduce((acc, point) => acc + point.x * point.y, 0);
  const sumXX = points.reduce((acc, point) => acc + point.x * point.x, 0);
  const denominator = count * sumXX - sumX * sumX;

  if (denominator === 0) return 0;

  return (count * sumXY - sumX * sumY) / denominator;
};

export const analyzeWeightTrend = (weightLogs = []) => {
  const logs = parseWeightLogs(weightLogs);

  if (logs.length < 3) {
    return {
      trend: "insufficient_data",
      slopePerDay: 0,
      message: "Weight trend needs more entries. Add 3+ consistent logs for better coaching."
    };
  }

  const slopePerDay = getWeightSlopePerDay(logs);
  const STABLE_THRESHOLD = 0.05; // ~0.35kg weekly movement

  if (slopePerDay > STABLE_THRESHOLD) {
    return {
      trend: "increasing",
      slopePerDay,
      message: "Your weight is increasing steadily."
    };
  }

  if (slopePerDay < -STABLE_THRESHOLD) {
    return {
      trend: "decreasing",
      slopePerDay,
      message: "Your weight is decreasing steadily."
    };
  }

  return {
    trend: "stable",
    slopePerDay,
    message: "Your weight pattern is stable."
  };
};

export const predictWeight = (weightLogs = [], days = 7) => {
  const logs = parseWeightLogs(weightLogs);

  if (!logs.length) {
    return [];
  }

  if (logs.length === 1) {
    const base = logs[0];
    return Array.from({ length: days }, (_, index) => ({
      date: new Date(base.dateMs + DAY_IN_MS * (index + 1)).toISOString().slice(0, 10),
      weight: Number(base.weight.toFixed(1))
    }));
  }

  const slopePerDay = getWeightSlopePerDay(logs);
  const last = logs[logs.length - 1];

  return Array.from({ length: days }, (_, index) => {
    const projected = last.weight + slopePerDay * (index + 1);
    return {
      date: new Date(last.dateMs + DAY_IN_MS * (index + 1)).toISOString().slice(0, 10),
      weight: Number(projected.toFixed(1))
    };
  });
};

const getHabitInsight = (habits = []) => {
  if (!habits.length) return "No habit data yet. Start logging your daily habits.";

  let weakestHabit = null;
  let weakestRate = 0;

  habits.forEach((habit) => {
    const values = Object.values(habit.completed || {});
    if (!values.length) return;

    const completionRate = values.filter(Boolean).length / values.length;
    if (completionRate < weakestRate || !weakestHabit) {
      weakestRate = completionRate;
      weakestHabit = {
        name: habit.name,
        completionRate
      };
    }
  });

  if (!weakestHabit) {
    return "Great job keeping habit records. Keep your streaks active this week.";
  }

  if (weakestHabit.completionRate < 0.45) {
    return `Your weakest habit is "${weakestHabit.name}". Reduce it to a 2-minute version and anchor it to a fixed time.`;
  }

  return `Your habit consistency is improving. Keep reinforcing "${weakestHabit.name}" with reminders.`;
};

const getTaskInsight = (tasks = []) => {
  if (!tasks.length) return "No active tasks found. Create one high-impact task for today.";

  const taskLogs = tasks.reduce((count, task) => count + (task.logs?.length || 0), 0);

  if (taskLogs < 3) {
    return "Task execution is low. Plan one focused 25-minute sprint in your top priority task.";
  }

  return "Task momentum looks healthy. Keep closing at least one meaningful task daily.";
};

const getWeightInsight = (weightLogs = []) => {
  const logs = parseWeightLogs(weightLogs);
  if (!logs.length) {
    return "Weight records are incomplete. Keep numeric entries to unlock richer analysis.";
  }

  const trendAnalysis = analyzeWeightTrend(logs);
  const predictions = predictWeight(logs, 7);
  const day7Weight = predictions[predictions.length - 1]?.weight;
  const trendMessage = trendAnalysis.message;

  if (trendAnalysis.trend === "insufficient_data") {
    return trendMessage;
  }

  if (trendAnalysis.trend === "increasing") {
    return `${trendMessage} You may reach ${day7Weight} kg in 7 days. Consider improving consistency in habits, movement, and sleep.`;
  }

  if (trendAnalysis.trend === "decreasing") {
    return `${trendMessage} You may reach ${day7Weight} kg in 7 days. Keep your nutrition and activity routine consistent.`;
  }

  return `${trendMessage} You may remain around ${day7Weight} kg in 7 days. Consider improving consistency in habits for clearer progress.`;
};

const getFinanceInsight = (financeData = {}) => {
  const entries = Array.isArray(financeData) ? financeData : financeData.entries || [];
  if (!entries.length) return "No finance entries yet. Start by tracking spending for 3 days.";

  const totals = entries.reduce(
    (acc, entry) => {
      const amount = Number(entry.amount || 0);
      if (amount >= 0) {
        acc.income += amount;
      } else {
        acc.expense += Math.abs(amount);
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  if (totals.expense > totals.income) {
    return "Your spending is above income in recent entries. Cut one low-value category this week.";
  }

  return "Your finance trend is controlled. Route a portion of surplus to savings automatically.";
};

const getModuleScopedSuggestion = (module, contextData) => {
  switch (module) {
    case "habits":
      return getHabitInsight(contextData.habits);
    case "finance":
      return getFinanceInsight(contextData.financeData);
    case "health":
      return getWeightInsight(contextData.weightLogs);
    default:
      return null;
  }
};

export const getSuggestionPrompts = (module = "general") => {
  const common = [
    "What should I improve today?",
    "Give me a weekly action plan",
    "How can I stay consistent?"
  ];

  if (module === "habits") {
    return ["Which habit needs attention?", "How do I rebuild my streak?", ...common];
  }

  if (module === "finance") {
    return ["How is my spending trend?", "Where can I reduce costs?", ...common];
  }

  if (module === "health") {
    return ["How is my weight trend?", "What should I do this week for health?", ...common];
  }

  return common;
};

export const generateAIResponse = async (userInput, contextData = {}) => {
  const input = normalize(userInput);
  const { habits = [], tasks = [], weightLogs = [], financeData = [], module = "general" } = contextData;

  const moduleSuggestion = getModuleScopedSuggestion(module, contextData);

  const responseParts = [];

  if (input.includes("habit") || module === "habits") {
    responseParts.push(getHabitInsight(habits));
  }

  if (input.includes("task") || input.includes("focus")) {
    responseParts.push(getTaskInsight(tasks));
  }

  if (input.includes("weight") || input.includes("health") || module === "health") {
    responseParts.push(getWeightInsight(weightLogs));
  }

  if (input.includes("finance") || input.includes("money") || input.includes("spend") || module === "finance") {
    responseParts.push(getFinanceInsight(financeData));
  }

  if (!responseParts.length && moduleSuggestion) {
    responseParts.push(moduleSuggestion);
  }

  const shouldAutoIncludeWeightInsight =
    !responseParts.some((part) => part.includes("weight") || part.includes("kg")) &&
    parseWeightLogs(weightLogs).length >= 2;

  if (shouldAutoIncludeWeightInsight) {
    responseParts.push(getWeightInsight(weightLogs));
  }

  if (!responseParts.length) {
    responseParts.push(
      "You are making progress. For today: complete one key task, log one habit, and review your latest health/finance numbers."
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 550));

  return `🤖 ${responseParts.slice(0, 2).join(" ")}`;
};