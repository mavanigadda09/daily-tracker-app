/**
 * Productivity.jsx
 * ─────────────────────────────────────────────────────────────
 * Two panels: Tasks (with live timer) and Activities (with progress).
 *
 * Improvements over original:
 *
 * Logic
 *  • Live timer — useInterval ticks every second while a task runs,
 *    displaying elapsed time without mutating state on every tick
 *  • Task completion — tasks can be marked done (not just idle/running)
 *  • Delete on both tasks and activities
 *  • useMemo for derived lists (activities, task stats)
 *  • formatDuration() — converts seconds to "1h 23m 45s"
 *  • Activities: custom target on creation, clamped to [0, target]
 *
 * UX
 *  • Empty states with a call-to-action hint
 *  • Active mode tab indicator (pill underline)
 *  • Progress bar on activity cards
 *  • Task card shows total tracked time + session count
 *  • Confirm before delete
 *  • Enter key submits the add form
 *  • Input clears and re-focuses after add
 *
 * Code
 *  • CSS-in-JS string, ob-* → pr-* namespace
 *  • No inline style objects in JSX
 *  • All state mutations are isolated updater functions
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ─── Helpers ──────────────────────────────────────────────────

/** Convert total seconds to a human-readable string: "1h 23m 45s" */
function formatDuration(seconds) {
  if (!seconds || seconds < 1) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}

/** Clamp a number between min and max. */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Generate a new task object. */
function makeTask(name) {
  return {
    id:            crypto.randomUUID(),
    name:          name.trim(),
    status:        "idle",       // idle | running | done
    totalDuration: 0,            // seconds
    sessions:      [],
    currentStart:  null,
  };
}

/** Generate a new activity object. */
function makeActivity(name, target) {
  return {
    id:     crypto.randomUUID(),
    name:   name.trim(),
    type:   "activity",
    value:  0,
    target: target > 0 ? target : 10,
  };
}

// ─── useInterval ──────────────────────────────────────────────
// Ticks a callback on an interval; pauses when delay is null.
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ─── Sub-components ───────────────────────────────────────────

function EmptyState({ icon, message, hint }) {
  return (
    <div className="pr-empty">
      <span className="pr-empty-icon" aria-hidden="true">{icon}</span>
      <p className="pr-empty-msg">{message}</p>
      <p className="pr-empty-hint">{hint}</p>
    </div>
  );
}

function ProgressBar({ value, max, color = "var(--accent)" }) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div className="pr-progress-track" aria-label={`${Math.round(pct)}% complete`}>
      <div
        className="pr-progress-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function TaskCard({ task, onStart, onStop, onDone, onDelete, liveElapsed }) {
  const isRunning  = task.status === "running";
  const isDone     = task.status === "done";
  const totalSecs  = task.totalDuration + (isRunning ? liveElapsed : 0);
  const sessionCount = task.sessions.length + (isRunning ? 1 : 0);

  return (
    <div
      className={`pr-card pr-task-card${isDone ? " pr-task-card--done" : ""}${isRunning ? " pr-task-card--running" : ""}`}
      role="listitem"
    >
      <div className="pr-card-main">
        <div className="pr-card-info">
          <span className={`pr-task-status-dot pr-task-status-dot--${task.status}`} aria-hidden="true" />
          <span className="pr-card-name">{task.name}</span>
        </div>
        <div className="pr-task-meta">
          <span className="pr-task-time">{formatDuration(totalSecs)}</span>
          {sessionCount > 0 && (
            <span className="pr-task-sessions">{sessionCount} session{sessionCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      <div className="pr-card-actions">
        {!isDone && (
          isRunning ? (
            <button
              className="pr-btn pr-btn--stop"
              onClick={onStop}
              aria-label={`Stop timer for ${task.name}`}
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              className="pr-btn pr-btn--start"
              onClick={onStart}
              aria-label={`Start timer for ${task.name}`}
            >
              ▶ Start
            </button>
          )
        )}
        {!isRunning && !isDone && (
          <button
            className="pr-btn pr-btn--done"
            onClick={onDone}
            aria-label={`Mark ${task.name} as done`}
          >
            ✓ Done
          </button>
        )}
        {isDone && (
          <span className="pr-done-badge" aria-label="Task completed">✦ Complete</span>
        )}
        <button
          className="pr-btn pr-btn--delete"
          onClick={onDelete}
          aria-label={`Delete task ${task.name}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function ActivityCard({ activity, onIncrement, onDecrement, onDelete }) {
  const { name, value, target } = activity;
  const pct       = target > 0 ? clamp((value / target) * 100, 0, 100) : 0;
  const isComplete = pct >= 100;

  return (
    <div
      className={`pr-card pr-activity-card${isComplete ? " pr-activity-card--complete" : ""}`}
      role="listitem"
    >
      <div className="pr-card-main">
        <div className="pr-card-info">
          <span className="pr-card-name">{name}</span>
          {isComplete && (
            <span className="pr-done-badge" aria-label="Goal reached">✦ Goal</span>
          )}
        </div>
        <span className="pr-activity-fraction">
          {value} <span className="pr-activity-target">/ {target}</span>
        </span>
      </div>

      <ProgressBar
        value={value}
        max={target}
        color={isComplete ? "#22c55e" : "var(--accent)"}
      />

      <div className="pr-card-actions">
        <button
          className="pr-btn pr-btn--decrement"
          onClick={onDecrement}
          aria-label={`Decrease ${name}`}
          disabled={value <= 0}
        >
          −
        </button>
        <button
          className="pr-btn pr-btn--increment"
          onClick={onIncrement}
          aria-label={`Increase ${name}`}
          disabled={isComplete}
        >
          +
        </button>
        <button
          className="pr-btn pr-btn--delete"
          onClick={onDelete}
          aria-label={`Delete activity ${name}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function Productivity({
  tasks  = [], setTasks,
  items  = [], setItems,
}) {
  const [name,     setName]     = useState("");
  const [target,   setTarget]   = useState("");  // activity target input
  const [mode,     setMode]     = useState("task"); // "task" | "activity"
  const [tick,     setTick]     = useState(0);   // drives live timer display
  const nameInputRef = useRef(null);

  // Tick every second while any task is running (powers live timer display)
  const hasRunning = useMemo(() => tasks.some((t) => t.status === "running"), [tasks]);
  useInterval(() => setTick((n) => n + 1), hasRunning ? 1000 : null);

  // Derived lists
  const activities = useMemo(() => items.filter((i) => i.type === "activity"), [items]);
  const taskStats  = useMemo(() => ({
    total:   tasks.length,
    running: tasks.filter((t) => t.status === "running").length,
    done:    tasks.filter((t) => t.status === "done").length,
  }), [tasks]);

  // ── Add ──────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    if (!name.trim()) return;

    if (mode === "task") {
      setTasks((prev) => [...prev, makeTask(name)]);
    } else {
      const parsedTarget = parseInt(target, 10);
      setItems((prev) => [...prev, makeActivity(name, parsedTarget || 10)]);
    }

    setName("");
    setTarget("");
    nameInputRef.current?.focus();
  }, [name, target, mode, setTasks, setItems]);

  const handleKeyDown = (e) => { if (e.key === "Enter") handleAdd(); };

  // ── Task actions ─────────────────────────────────────────
  const startTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: "running", currentStart: Date.now() } : t
    ));
  }, [setTasks]);

  const stopTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id || t.status !== "running") return t;
      const duration = (Date.now() - t.currentStart) / 1000;
      return {
        ...t,
        status:        "idle",
        totalDuration: t.totalDuration + duration,
        sessions:      [...t.sessions, { duration, end: Date.now() }],
        currentStart:  null,
      };
    }));
  }, [setTasks]);

  const completeTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: "done" } : t
    ));
  }, [setTasks]);

  const deleteTask = useCallback((id) => {
    if (!window.confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [setTasks]);

  // ── Activity actions ─────────────────────────────────────
  const updateActivity = useCallback((id, delta) => {
    setItems((prev) => prev.map((i) =>
      i.id === id ? { ...i, value: clamp((i.value || 0) + delta, 0, i.target) } : i
    ));
  }, [setItems]);

  const deleteActivity = useCallback((id) => {
    if (!window.confirm("Delete this activity?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [setItems]);

  // ── Live elapsed seconds for the running task ────────────
  const runningTask   = tasks.find((t) => t.status === "running");
  const liveElapsed   = runningTask
    ? (Date.now() - runningTask.currentStart) / 1000
    : 0;

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      <div className="pr-root">

        {/* Header */}
        <header className="pr-header">
          <div>
            <h1 className="pr-title">Productivity</h1>
            <p className="pr-subtitle">
              {mode === "task"
                ? `${taskStats.done} done · ${taskStats.running} active · ${taskStats.total} total`
                : `${activities.length} activit${activities.length !== 1 ? "ies" : "y"} tracked`}
            </p>
          </div>
        </header>

        {/* Mode tabs */}
        <div className="pr-tabs" role="tablist" aria-label="View mode">
          {[
            { id: "task",     label: "Tasks",      icon: "⏱" },
            { id: "activity", label: "Activities", icon: "◎" },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              className={`pr-tab${mode === id ? " pr-tab--active" : ""}`}
              onClick={() => setMode(id)}
            >
              <span aria-hidden="true">{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* Add form */}
        <div className="pr-add-form" role="form" aria-label={`Add ${mode}`}>
          <input
            ref={nameInputRef}
            className="pr-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "task" ? "Task name…" : "Activity name…"}
            aria-label={mode === "task" ? "Task name" : "Activity name"}
          />
          {mode === "activity" && (
            <input
              className="pr-input pr-input--target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Target (e.g. 10)"
              type="number"
              min="1"
              aria-label="Activity target"
            />
          )}
          <button
            className="pr-add-btn"
            onClick={handleAdd}
            aria-label={`Add ${mode}`}
          >
            + Add
          </button>
        </div>

        {/* Lists */}
        <div className="pr-list" role="list" aria-label={mode === "task" ? "Tasks" : "Activities"}>
          {mode === "task" ? (
            tasks.length === 0 ? (
              <EmptyState
                icon="⏱"
                message="No tasks yet"
                hint="Add a task above and start the timer"
              />
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={() => startTask(task.id)}
                  onStop={() => stopTask(task.id)}
                  onDone={() => completeTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  liveElapsed={task.status === "running" ? liveElapsed : 0}
                />
              ))
            )
          ) : (
            activities.length === 0 ? (
              <EmptyState
                icon="◎"
                message="No activities yet"
                hint="Add an activity and set a daily target"
              />
            ) : (
              activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onIncrement={() => updateActivity(activity.id, 1)}
                  onDecrement={() => updateActivity(activity.id, -1)}
                  onDelete={() => deleteActivity(activity.id)}
                />
              ))
            )
          )}
        </div>

      </div>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────
const CSS = `
.pr-root {
  padding: 24px 20px 40px;
  max-width: 680px;
  margin: 0 auto;
  font-family: 'Syne', sans-serif;
  color: var(--text, #fff);
}

/* Header */
.pr-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}
.pr-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 4px;
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.pr-subtitle {
  font-size: 12px;
  color: var(--text-muted, rgba(255,255,255,0.4));
  margin: 0;
  letter-spacing: 0.03em;
}

/* Tabs */
.pr-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 18px;
}
.pr-tab {
  flex: 1;
  padding: 9px 16px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--text-muted, rgba(255,255,255,0.4));
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.pr-tab:hover:not(.pr-tab--active) { color: rgba(255,255,255,0.7); }
.pr-tab--active {
  background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(250,204,21,0.1));
  color: #fff;
  border: 1px solid rgba(249,115,22,0.25);
}
.pr-tab:focus-visible { outline: 2px solid var(--accent, #f97316); outline-offset: 2px; }

/* Add form */
.pr-add-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.pr-input {
  flex: 1;
  min-width: 0;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  background: rgba(255,255,255,0.04);
  color: var(--text, #fff);
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.pr-input--target { flex: 0 0 120px; }
.pr-input::placeholder { color: rgba(255,255,255,0.2); }
.pr-input:focus {
  border-color: rgba(249,115,22,0.5);
  box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
}
.pr-input:focus-visible { outline: 2px solid var(--accent, #f97316); outline-offset: 2px; }
/* Prevent iOS zoom */
@media (max-width: 680px) { .pr-input { font-size: 16px; } }

.pr-add-btn {
  padding: 11px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #f97316, #facc15);
  color: #050810;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s, transform 0.15s;
}
.pr-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.pr-add-btn:active { transform: translateY(0); }
.pr-add-btn:focus-visible { outline: 2px solid #facc15; outline-offset: 2px; }

/* List */
.pr-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Empty state */
.pr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 8px;
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 16px;
}
.pr-empty-icon { font-size: 32px; opacity: 0.4; }
.pr-empty-msg  { font-size: 14px; color: rgba(255,255,255,0.45); margin: 0; font-weight: 500; }
.pr-empty-hint { font-size: 12px; color: rgba(255,255,255,0.25); margin: 0; }

/* Card base */
.pr-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  background: var(--card, rgba(255,255,255,0.04));
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s;
  animation: prCardIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes prCardIn {
  from { opacity:0; transform: translateY(8px); }
  to   { opacity:1; transform: translateY(0); }
}
.pr-card-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pr-card-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.pr-card-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pr-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Task card variants */
.pr-task-card--running {
  border-color: rgba(249,115,22,0.35);
  background: rgba(249,115,22,0.05);
}
.pr-task-card--done {
  opacity: 0.55;
  border-color: rgba(34,197,94,0.25);
}
.pr-task-status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pr-task-status-dot--idle    { background: rgba(255,255,255,0.2); }
.pr-task-status-dot--running {
  background: #f97316;
  box-shadow: 0 0 0 3px rgba(249,115,22,0.2);
  animation: prPulse 1.4s ease-in-out infinite;
}
.pr-task-status-dot--done { background: #22c55e; }
@keyframes prPulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(249,115,22,0.2); }
  50%     { box-shadow: 0 0 0 5px rgba(249,115,22,0.1); }
}
.pr-task-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}
.pr-task-time {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent, #f97316);
  font-variant-numeric: tabular-nums;
}
.pr-task-sessions {
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.04em;
}

/* Activity card */
.pr-activity-card--complete { border-color: rgba(34,197,94,0.3); }
.pr-activity-fraction {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.pr-activity-target {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  font-weight: 400;
}

/* Progress bar */
.pr-progress-track {
  width: 100%;
  height: 5px;
  border-radius: 4px;
  background: rgba(255,255,255,0.07);
  overflow: hidden;
}
.pr-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s cubic-bezier(0.4,0,0.2,1), background 0.3s;
}

/* Buttons */
.pr-btn {
  padding: 7px 13px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.12s, background 0.2s;
  white-space: nowrap;
}
.pr-btn:hover { opacity: 0.85; transform: translateY(-1px); }
.pr-btn:active { transform: translateY(0); }
.pr-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.pr-btn:focus-visible { outline: 2px solid var(--accent, #f97316); outline-offset: 2px; }

.pr-btn--start {
  background: rgba(249,115,22,0.15);
  border-color: rgba(249,115,22,0.3);
  color: #f97316;
}
.pr-btn--stop {
  background: rgba(239,68,68,0.12);
  border-color: rgba(239,68,68,0.3);
  color: #f87171;
}
.pr-btn--done {
  background: rgba(34,197,94,0.1);
  border-color: rgba(34,197,94,0.25);
  color: #4ade80;
}
.pr-btn--increment {
  background: rgba(249,115,22,0.12);
  border-color: rgba(249,115,22,0.25);
  color: #f97316;
  font-size: 16px;
  padding: 4px 12px;
}
.pr-btn--decrement {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  padding: 4px 12px;
}
.pr-btn--delete {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.25);
  padding: 6px 8px;
  font-size: 13px;
  margin-left: auto;
}
.pr-btn--delete:hover { color: #f87171; opacity: 1; }

/* Done badge */
.pr-done-badge {
  font-size: 11px;
  font-weight: 500;
  color: #4ade80;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 100px;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.2);
}

/* Mobile */
@media (max-width: 480px) {
  .pr-root { padding: 16px 14px 32px; }
  .pr-add-form { gap: 8px; }
  .pr-input--target { flex: 0 0 90px; }
  .pr-card-actions { gap: 6px; }
  .pr-btn { padding: 6px 10px; }
}
`;
