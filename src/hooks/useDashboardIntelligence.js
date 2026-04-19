/**
 * useDashboardIntelligence
 * ─────────────────────────────────────────────────────────────
 * Pure business-logic hook. Zero JSX, zero styles.
 * Responsible for:
 *   • Issue detection  (overdue tasks, missed habits, weight stall)
 *   • Daily focus      (single highest-priority next action)
 *   • Metric enrichment (progress %, trend direction, severity)
 *   • Step tracking    (device-motion abstraction)
 *
 * Dependencies: React only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────
const STEP_GOAL          = 10_000;
const WEIGHT_STALL_DAYS  = 7;    // flag if weight unchanged for N days
const TASK_OVERDUE_MS    = 0;    // anything past due-date counts
const MOTION_DEBOUNCE_MS = 100;
const MOTION_THRESHOLD   = 12;   // deltaZ sensitivity

// ─── Types (JSDoc) ────────────────────────────────────────────
/**
 * @typedef {Object} Issue
 * @property {'overdue'|'missed_habit'|'weight_stall'|'step_lag'} type
 * @property {'critical'|'warning'|'info'} severity
 * @property {string} label
 * @property {string} detail
 */

/**
 * @typedef {Object} FocusAction
 * @property {string} title
 * @property {string} description
 * @property {'task'|'habit'|'movement'|'log'} category
 * @property {'high'|'medium'|'low'} priority
 */

/**
 * @typedef {Object} EnrichedMetric
 * @property {string} key
 * @property {string} label
 * @property {string|number} value
 * @property {string} [unit]
 * @property {number} [progress]          // 0–100
 * @property {'up'|'down'|'flat'|null} [trend]
 * @property {'good'|'warn'|'bad'|null} [status]
 * @property {string} [actionHint]
 */

// ─── Step counter (device-motion) ─────────────────────────────
function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const lastZRef      = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    let active = true;

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const now = Date.now();
      if (now - lastUpdateRef.current > MOTION_DEBOUNCE_MS) {
        const deltaZ = Math.abs(acc.z - lastZRef.current);
        if (deltaZ > MOTION_THRESHOLD) {
          setSteps((p) => p + 1);
        }
        lastZRef.current      = acc.z;
        lastUpdateRef.current = now;
      }
    };

    const register = async () => {
      try {
        if (
          typeof DeviceMotionEvent !== "undefined" &&
          typeof DeviceMotionEvent.requestPermission === "function"
        ) {
          const res = await DeviceMotionEvent.requestPermission();
          if (res !== "granted") return;
        }
        if (active) window.addEventListener("devicemotion", handleMotion);
      } catch {
        /* sensors unavailable — steps remain 0 */
      }
    };

    register();
    return () => {
      active = false;
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);

  return steps;
}

// ─── Issue detection ──────────────────────────────────────────
function detectIssues({ tasks, items, weightLogs, steps }) {
  const issues = /** @type {Issue[]} */ ([]);
  const now = Date.now();

  // Overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate).getTime() + TASK_OVERDUE_MS < now
  );
  if (overdueTasks.length > 0) {
    issues.push({
      type: "overdue",
      severity: overdueTasks.length > 2 ? "critical" : "warning",
      label: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`,
      detail: overdueTasks.map((t) => t.title).slice(0, 3).join(", "),
    });
  }

  // Missed habits (items with type=habit and no completion today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const habits = items.filter((i) => i.type === "habit");
  const missedHabits = habits.filter((h) => {
    if (!h.lastCompleted) return true;
    return new Date(h.lastCompleted).getTime() < todayStart.getTime();
  });
  if (missedHabits.length > 0) {
    issues.push({
      type: "missed_habit",
      severity: missedHabits.length >= habits.length ? "warning" : "info",
      label: `${missedHabits.length} habit${missedHabits.length > 1 ? "s" : ""} pending`,
      detail: missedHabits.map((h) => h.name || h.title).slice(0, 3).join(", "),
    });
  }

  // Weight stall — no change for N days
  if (weightLogs.length >= 2) {
    const recent = weightLogs.slice(-WEIGHT_STALL_DAYS);
    const unique  = new Set(recent.map((l) => parseFloat(l.weight).toFixed(1)));
    const oldestDate = recent[0]?.date ? new Date(recent[0].date) : null;
    const daySpan = oldestDate ? Math.floor((now - oldestDate.getTime()) / 86_400_000) : 0;
    if (unique.size === 1 && daySpan >= WEIGHT_STALL_DAYS) {
      issues.push({
        type: "weight_stall",
        severity: "info",
        label: "Weight plateaued",
        detail: `No change in ${daySpan} days. Consider adjusting diet or training.`,
      });
    }
  }

  // Step lag (< 30 % of goal by afternoon)
  const hour = new Date().getHours();
  if (hour >= 14 && steps < STEP_GOAL * 0.3) {
    issues.push({
      type: "step_lag",
      severity: "warning",
      label: "Movement deficit",
      detail: `Only ${steps.toLocaleString()} steps by ${hour}:00. Target ${STEP_GOAL.toLocaleString()}.`,
    });
  }

  // Sort: critical → warning → info
  const rank = { critical: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// ─── Daily focus derivation ───────────────────────────────────
function deriveFocus({ issues, tasks, items, steps }) {
  // Critical overdue task first
  if (issues.find((i) => i.type === "overdue" && i.severity === "critical")) {
    const t = tasks
      .filter((t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
    if (t) return /** @type {FocusAction} */ ({
      title: t.title,
      description: "This task is overdue. Clear it first to restore momentum.",
      category: "task",
      priority: "high",
    });
  }

  // Pending habit
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const pendingHabit = items.find(
    (i) => i.type === "habit" && (!i.lastCompleted || new Date(i.lastCompleted) < todayStart)
  );
  if (pendingHabit) return {
    title: pendingHabit.name || pendingHabit.title,
    description: "Keep the streak alive — complete this habit before the day ends.",
    category: "habit",
    priority: "medium",
  };

  // Step deficit
  if (steps < STEP_GOAL * 0.5) return {
    title: "Get moving",
    description: `You're at ${steps.toLocaleString()} / ${STEP_GOAL.toLocaleString()} steps. A 20-min walk closes the gap.`,
    category: "movement",
    priority: steps < STEP_GOAL * 0.2 ? "high" : "medium",
  };

  // No weight log today
  const todayStr = new Date().toDateString();
  const loggedToday = /* weightLogs */ false; // caller passes this flag
  if (!loggedToday) return {
    title: "Log your weight",
    description: "Consistent tracking is the habit that makes all other habits work.",
    category: "log",
    priority: "low",
  };

  return {
    title: "All clear",
    description: "You're on top of everything today. Keep the momentum going.",
    category: "movement",
    priority: "low",
  };
}

// ─── Metric enrichment ────────────────────────────────────────
function enrichMetrics({ tasks, items, weightLogs, steps }) {
  const completedTasks  = tasks.filter((t) => t.status === "completed").length;
  const totalTasks      = tasks.length;
  const activeHabits    = items.filter((i) => i.type === "habit").length;

  // Weight trend
  const weights      = weightLogs.slice(-7).map((l) => parseFloat(l.weight));
  const latestWeight = weights.at(-1) ?? null;
  let weightTrend    = null;
  let weightStatus   = null;
  if (weights.length >= 2) {
    const delta = weights.at(-1) - weights[0];
    weightTrend  = delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat";
    // "down" is generally good for weight-loss context — keep neutral
    weightStatus = "good";
  }

  const stepProgress = Math.min((steps / STEP_GOAL) * 100, 100);
  const stepStatus   = stepProgress >= 100 ? "good" : stepProgress >= 50 ? "warn" : "bad";

  return /** @type {EnrichedMetric[]} */ ([
    {
      key: "steps",
      label: "Steps",
      value: steps.toLocaleString(),
      progress: stepProgress,
      status: stepStatus,
      actionHint: stepStatus !== "good" ? `${(STEP_GOAL - steps).toLocaleString()} to goal` : "Goal reached 🎉",
    },
    {
      key: "tasks",
      label: "Tasks Done",
      value: completedTasks,
      unit: `/ ${totalTasks}`,
      progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      status: completedTasks === totalTasks && totalTasks > 0 ? "good" : "warn",
      actionHint: totalTasks - completedTasks > 0
        ? `${totalTasks - completedTasks} remaining`
        : "All done",
    },
    {
      key: "habits",
      label: "Active Habits",
      value: activeHabits,
      status: activeHabits > 0 ? "good" : "warn",
      actionHint: activeHabits === 0 ? "Add a habit to start building streaks" : undefined,
    },
    {
      key: "weight",
      label: "Weight",
      value: latestWeight !== null ? latestWeight.toFixed(1) : "—",
      unit: "kg",
      trend: weightTrend,
      status: weightStatus,
      actionHint:
        weightTrend === "down" ? "Trending down — great work"
        : weightTrend === "up"  ? "Trending up — review your plan"
        : weightTrend === "flat"? "Plateau detected"
        : "Start logging weight",
    },
  ]);
}

// ─── Sparkline data ───────────────────────────────────────────
function buildSparklinePoints(weightLogs, width = 180, height = 40, padding = 5) {
  const weights = weightLogs.slice(-7).map((l) => parseFloat(l.weight));
  if (weights.length < 2) return null;

  const min   = Math.min(...weights);
  const max   = Math.max(...weights);
  const range = max - min || 1;

  return weights.map((w, i) => ({
    x: (i / (weights.length - 1)) * (width - padding * 2) + padding,
    y: height - ((w - min) / range * (height - padding * 2) + padding),
  }));
}

// ─── Public hook ──────────────────────────────────────────────
export function useDashboardIntelligence({ tasks = [], items = [], weightLogs = [] } = {}) {
  const steps = useStepCounter();

  const loggedToday = useMemo(() => {
    if (!weightLogs.length) return false;
    const last = weightLogs.at(-1);
    return new Date(last.date).toDateString() === new Date().toDateString();
  }, [weightLogs]);

  const issues = useMemo(
    () => detectIssues({ tasks, items, weightLogs, steps }),
    [tasks, items, weightLogs, steps]
  );

  const focus = useMemo(
    () => deriveFocus({ issues, tasks, items, steps, loggedToday }),
    [issues, tasks, items, steps, loggedToday]
  );

  const metrics = useMemo(
    () => enrichMetrics({ tasks, items, weightLogs, steps }),
    [tasks, items, weightLogs, steps]
  );

  const sparklinePoints = useMemo(
    () => buildSparklinePoints(weightLogs),
    [weightLogs]
  );

  return { steps, issues, focus, metrics, sparklinePoints, loggedToday };
}
