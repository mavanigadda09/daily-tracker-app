import { useMemo, useCallback } from "react";
import { useGoalForm } from "../../hooks/useGoalForm";
import { GoalProgressRing } from "./GoalProgressRing";

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (n) => (typeof n === "number" && !isNaN(n) ? `${n} kg` : "--");

const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

/**
 * Core progress calculation.
 * Handles both loss (start > target) and gain (target > start) goals.
 * Returns safe defaults — never NaN or Infinity.
 */
function calcProgress(goal, logs) {
  const start = Number(goal.startWeight);
  const target = Number(goal.targetWeight);

  if (!start || !target || start === target) {
    return { currentWeight: null, percent: 0, daysLeft: null, isGain: false, isOverdue: false };
  }

  const currentWeight = logs.length > 0
    ? logs[logs.length - 1].weight  // logs sorted ascending — last = latest
    : start;

  const isGain = target > start;
  const totalDelta = Math.abs(target - start);
  const currentDelta = isGain
    ? currentWeight - start      // gaining: higher is more progress
    : start - currentWeight;     // losing: lower is more progress

  const percent = Math.min(Math.max(Math.round((currentDelta / totalDelta) * 100), 0), 100);

  let daysLeft = null;
  let isOverdue = false;

  if (goal.endDate) {
    const msLeft = new Date(goal.endDate).getTime() - Date.now();
    const days = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    isOverdue = days < 0;
    daysLeft = Math.abs(days);
  }

  return { currentWeight, percent, daysLeft, isGain, isOverdue };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Goals({
  weightLogs = [],
  setWeightLogs,
  weightGoal,
  setWeightGoal,
}) {
  const { draft, setField, save, reset, isDirty, errors } = useGoalForm(
    weightGoal,
    setWeightGoal
  );

  // ── Log management ─────────────────────────────────────────────────────────

  // Local input state — stays local, not synced to Firebase until Add
  const [weightInput, setWeightInput] = useSafeState("");

  const addLog = useCallback(() => {
    const num = Number(weightInput);
    if (!num || num <= 0 || num > 500) return; // 500kg upper bound sanity check

    setWeightLogs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), date: Date.now(), weight: num },
    ]);
    setWeightInput("");
  }, [weightInput, setWeightLogs]);

  const deleteLog = useCallback((id) => {
    setWeightLogs((prev) => prev.filter((l) => l.id !== id));
  }, [setWeightLogs]);

  // ── Derived data ───────────────────────────────────────────────────────────

  // Ascending for calculations (latest = last element)
  const logsAsc = useMemo(
    () => [...weightLogs].sort((a, b) => a.date - b.date),
    [weightLogs]
  );

  // Descending for display (today at top)
  const logsDesc = useMemo(
    () => [...logsAsc].reverse(),
    [logsAsc]
  );

  const { currentWeight, percent, daysLeft, isGain, isOverdue } = useMemo(
    () => calcProgress(weightGoal || {}, logsAsc),
    [weightGoal, logsAsc]
  );

  const goalIsSet = !!(weightGoal?.startWeight && weightGoal?.targetWeight);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={s.container}>
      <h2 style={s.title}>Goal Tracker</h2>

      {/* GOAL FORM */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Set goal</h3>

        <div style={s.formGrid}>
          <LabeledInput
            label="Start weight (kg)"
            type="number"
            value={draft.startWeight}
            onChange={(v) => setField("startWeight", v)}
            error={errors.startWeight}
            min="0"
          />
          <LabeledInput
            label="Target weight (kg)"
            type="number"
            value={draft.targetWeight}
            onChange={(v) => setField("targetWeight", v)}
            error={errors.targetWeight}
            min="0"
          />
          <LabeledInput
            label="Start date"
            type="date"
            value={draft.startDate}
            onChange={(v) => setField("startDate", v)}
          />
          <LabeledInput
            label="End date"
            type="date"
            value={draft.endDate}
            onChange={(v) => setField("endDate", v)}
            error={errors.endDate}
          />
        </div>

        {/* Save/Cancel — explicit commit, not live-syncing */}
        {isDirty && (
          <div style={s.formActions}>
            <button style={s.saveBtn} onClick={save}>Save goal</button>
            <button style={s.cancelBtn} onClick={reset}>Cancel</button>
          </div>
        )}
      </div>

      {/* PROGRESS — only render when goal is configured */}
      {goalIsSet && (
        <div style={s.grid}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Progress</h3>
            <GoalProgressRing percent={percent} isGain={isGain} />
            <p style={s.subtext}>{fmt(currentWeight)} current</p>
            <p style={s.subtext}>
              Target: {fmt(Number(weightGoal.targetWeight))}
            </p>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>
              {isOverdue ? "Overdue by" : "Days left"}
            </h3>
            <div style={{
              ...s.bigNumber,
              color: isOverdue
                ? "var(--color-text-danger)"
                : "var(--color-text-success)",
            }}>
              {daysLeft !== null ? daysLeft : "--"}
            </div>
            {isOverdue && (
              <p style={{ ...s.subtext, color: "var(--color-text-danger)" }}>
                days past end date
              </p>
            )}
          </div>
        </div>
      )}

      {/* ADD LOG */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Log today's weight</h3>
        <div style={s.row}>
          <input
            style={s.input}
            type="number"
            placeholder="Weight in kg"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLog()}
            min="0"
            max="500"
          />
          <button style={s.addBtn} onClick={addLog}>
            Add
          </button>
        </div>
      </div>

      {/* HISTORY */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>History</h3>

        {logsDesc.length === 0 ? (
          <p style={s.subtext}>No weight logs yet</p>
        ) : (
          logsDesc.map((l) => (
            <div key={l.id} style={s.historyRow}>
              <span style={s.dateText}>{fmtDate(l.date)}</span>
              <span style={s.weightText}>{l.weight} kg</span>
              <button
                style={s.deleteBtn}
                onClick={() => deleteLog(l.id)}
                aria-label={`Delete log for ${fmtDate(l.date)}`}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function LabeledInput({ label, type = "text", value, onChange, error, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={s.label}>{label}</label>
      <input
        style={{
          ...s.input,
          borderColor: error ? "var(--color-border-danger)" : undefined,
        }}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {error && <span style={s.errorText}>{error}</span>}
    </div>
  );
}

// Minimal safe useState wrapper — avoids the useState import being forgotten
function useSafeState(initial) {
  const { useState } = require("react");
  return useState(initial);
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = {
  container: {
    padding: 24,
    color: "var(--color-text-primary)",
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 16,
  },
  card: {
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    fontWeight: 500,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  },
  errorText: {
    fontSize: 11,
    color: "var(--color-text-danger)",
  },
  formActions: {
    display: "flex",
    gap: 8,
    paddingTop: 4,
  },
  saveBtn: {
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  cancelBtn: {
    background: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid var(--color-border-secondary)",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 16,
  },
  subtext: {
    fontSize: 13,
    color: "var(--color-text-secondary)",
    textAlign: "center",
    margin: 0,
  },
  bigNumber: {
    fontSize: 42,
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1,
    padding: "16px 0",
  },
  row: {
    display: "flex",
    gap: 10,
  },
  addBtn: {
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid var(--color-border-tertiary)",
  },
  dateText: {
    fontSize: 13,
    color: "var(--color-text-secondary)",
    flex: 1,
  },
  weightText: {
    fontSize: 14,
    fontWeight: 500,
    marginRight: 12,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "var(--color-text-tertiary)",
    cursor: "pointer",
    fontSize: 13,
    padding: "2px 6px",
    borderRadius: 4,
  },
};