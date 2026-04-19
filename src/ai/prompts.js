/**
 * prompts.js
 * Central store for all AI prompt templates.
 * Keep logic out of here — pure string templates only.
 */

/**
 * Builds the system prompt for the AI coach.
 * @param {Object} context - User context from useAppData
 */
export function buildSystemPrompt(context) {
  const {
    userName = "User",
    tasks = [],
    habits = [],
    goals = [],
    expenses = [],
    focusScore = 0,
  } = context;

  const pendingTasks  = tasks.filter((t) => !t.completed).length;
  const activeHabits  = habits.filter((h) => h.active).length;
  const activeGoals   = goals.filter((g) => g.progress < 100).length;
  const todaySpend    = expenses
    .filter((e) => isToday(e.date))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return `You are Phoenix, an intelligent personal productivity coach inside the Phoenix Tracker app.

USER CONTEXT:
- Name: ${userName}
- Focus Score: ${focusScore}/100
- Pending Tasks: ${pendingTasks}
- Active Habits: ${activeHabits}
- Active Goals: ${activeGoals}
- Today's Spending: ₹${todaySpend.toFixed(2)}

PERSONALITY:
- Motivating but honest
- Concise — max 3 sentences per response unless asked to elaborate
- Use the user's name occasionally
- Reference their actual data when giving advice

CAPABILITIES — you can trigger these actions by responding with JSON blocks:
- Add task:    { "action": "ADD_TASK",    "data": { "title": "", "priority": "high|medium|low" } }
- Add habit:   { "action": "ADD_HABIT",   "data": { "name": "", "frequency": "daily|weekly" } }
- Add expense: { "action": "ADD_EXPENSE", "data": { "amount": 0, "category": "", "note": "" } }
- Add goal:    { "action": "ADD_GOAL",    "data": { "title": "", "target": 0, "unit": "" } }

Only trigger actions when the user explicitly asks to add/create something.
Always respond in the same language the user writes in.`;
}

/**
 * Builds a single user message with optional data snapshot.
 */
export function buildUserMessage(userInput, includeSnapshot = false, snapshot = {}) {
  if (!includeSnapshot) return userInput;

  return `${userInput}

[Current snapshot: tasks=${snapshot.tasks?.length ?? 0}, habits=${snapshot.habits?.length ?? 0}, goals=${snapshot.goals?.length ?? 0}]`;
}

/**
 * Prompt for dashboard intelligence analysis.
 */
export function buildDashboardAnalysisPrompt(data) {
  const {
    tasks = [],
    habits = [],
    goals = [],
    expenses = [],
    routines = [],
  } = data;

  const completedToday = tasks.filter(
    (t) => t.completed && isToday(t.completedAt)
  ).length;

  const overdueCount = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  return `Analyze this productivity data and return a JSON object with exactly this shape:
{
  "focusScore": <number 0-100>,
  "insight": "<one encouraging sentence about progress>",
  "suggestion": "<one specific actionable suggestion>",
  "issues": ["<issue1>", "<issue2>"] // max 3, only real problems
}

DATA:
- Tasks completed today: ${completedToday}
- Overdue tasks: ${overdueCount}
- Total pending tasks: ${tasks.filter((t) => !t.completed).length}
- Active habits: ${habits.filter((h) => h.active).length}
- Habit streak average: ${getAverageStreak(habits)}
- Goals in progress: ${goals.filter((g) => g.progress < 100).length}
- Active routines: ${routines.filter((r) => r.active).length}

Return ONLY the JSON object. No explanation, no markdown.`;
}

// ─── Helpers (private) ──────────────────────────────────────

function isToday(dateValue) {
  if (!dateValue) return false;
  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  const today = new Date();
  return (
    date.getDate()     === today.getDate()   &&
    date.getMonth()    === today.getMonth()  &&
    date.getFullYear() === today.getFullYear()
  );
}

function getAverageStreak(habits) {
  if (!habits.length) return 0;
  const total = habits.reduce((sum, h) => sum + (h.streak || 0), 0);
  return Math.round(total / habits.length);
}