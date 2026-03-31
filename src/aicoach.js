const normalize = (value) => String(value || "").toLowerCase();

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
  if (weightLogs.length < 3) {
    return "Weight trend needs more entries. Add 3+ consistent logs for better coaching.";
  }

  const recent = weightLogs.slice(-5);
  const first = recent[0]?.weight;
  const latest = recent[recent.length - 1]?.weight;

  if (typeof first !== "number" || typeof latest !== "number") {
    return "Weight records are incomplete. Keep numeric entries to unlock richer analysis.";
  }

  const diff = latest - first;

  if (diff > 0.8) {
    return "Weight trend is up. Add a light evening walk and keep hydration consistent.";
  }

  if (diff < -0.8) {
    return "Weight trend is moving in a good direction. Maintain your current nutrition and sleep routine.";
  }

  return "Weight trend is stable. Improve consistency in activity for stronger movement.";
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

  if (!responseParts.length) {
    responseParts.push(
      "You are making progress. For today: complete one key task, log one habit, and review your latest health/finance numbers."
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 550));

  return `🤖 ${responseParts.slice(0, 2).join(" ")}`;
};
