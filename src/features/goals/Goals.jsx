import { useState, useMemo, useCallback } from "react";
import { useGoalForm } from "../../hooks/useGoalForm";
import { GoalProgressRing } from "./GoalProgressRing";

const fmt = (n) => (typeof n === "number" && !isNaN(n) ? `${n} kg` : "--");

const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

function calcProgress(goal, logs) {
  const start  = Number(goal.startWeight);
  const target = Number(goal.targetWeight);
  if (!start || !target || start === target) {
    return { currentWeight: null, percent: 0, daysLeft: null, isGain: false, isOverdue: false };
  }
  const currentWeight = logs.length > 0 ? logs[logs.length - 1].weight : start;
  const isGain        = target > start;
  const totalDelta    = Math.abs(target - start);
  const currentDelta  = isGain ? currentWeight - start : start - currentWeight;
  const percent       = Math.min(Math.max(Math.round((currentDelta / totalDelta) * 100), 0), 100);
  let daysLeft = null;
  let isOverdue = false;
  if (goal.endDate) {
    const msLeft = new Date(goal.endDate).getTime() - Date.now();
    const days   = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    isOverdue = days < 0;
    daysLeft  = Math.abs(days);
  }
  return { currentWeight, percent, daysLeft, isGain, isOverdue };
}

export default function Goals({
  weightLogs = [],
  setWeightLogs,
  weightGoal,
  setWeightGoal,
}) {
  const { draft, setField, save, reset, isDirty, errors } = useGoalForm(weightGoal, setWeightGoal);
  const [weightInput, setWeightInput] = useState("");

  const addLog = useCallback(() => {
    const num = Number(weightInput);
    if (!num || num <= 0 || num > 500) return;
    setWeightLogs((prev) => [...prev, { id: crypto.randomUUID(), date: Date.now(), weight: num }]);
    setWeightInput("");
  }, [weightInput, setWeightLogs]);

  const deleteLog = useCallback((id) => {
    setWeightLogs((prev) => prev.filter((l) => l.id !== id));
  }, [setWeightLogs]);

  const logsAsc  = useMemo(() => [...weightLogs].sort((a, b) => a.date - b.date), [weightLogs]);
  const logsDesc = useMemo(() => [...logsAsc].reverse(), [logsAsc]);

  const { currentWeight, percent, daysLeft, isGain, isOverdue } = useMemo(
    () => calcProgress(weightGoal || {}, logsAsc),
    [weightGoal, logsAsc]
  );

  const goalIsSet = !!(weightGoal?.startWeight && weightGoal?.targetWeight);

  return (
    <div style={s.container}>
      <h2 style={s.title}>Goal Tracker</h2>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Set goal</h3>
        <div style={s.formGrid}>
          <LabeledInput label="Start weight (kg)" type="number" value={draft.startWeight} onChange={(v) => setField("startWeight", v)} error={errors.startWeight} min="0" />
          <LabeledInput label="Target weight (kg)" type="number" value={draft.targetWeight} onChange={(v) => setField("targetWeight", v)} error={errors.targetWeight} min="0" />
          <LabeledInput label="Start date" type="date" value={draft.startDate} onChange={(v) => setField("startDate", v)} />
          <LabeledInput label="End date" type="date" value={draft.endDate} onChange={(v) => setField("endDate", v)} error={errors.endDate} />
        </div>
        {isDirty && (
          <div style={s.formActions}>
            <button style={s.saveBtn} onClick={save}>Save goal</button>
            <button style={s.cancelBtn} onClick={reset}>Cancel</button>
          </div>
        )}
      </div>

      {goalIsSet && (
        <div style={s.grid}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Progress</h3>
            <GoalProgressRing percent={percent} isGain={isGain} />
            <p style={s.subtext}>{fmt(currentWeight)} current</p>
            <p style={s.subtext}>Target: {fmt(Number(weightGoal.targetWeight))}</p>
          </div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>{isOverdue ? "Overdue by" : "Days left"}</h3>
            <div style={{ ...s.bigNumber, color: isOverdue ? "var(--color-text-danger)" : "var(--color-text-success)" }}>
              {daysLeft !== null ? daysLeft : "--"}
            </div>
            {isOverdue && <p style={{ ...s.subtext, color: "var(--color-text-danger)" }}>days past end date</p>}
          </div>
        </div>
      )}

      {!goalIsSet && (
        <div style={s.emptyState}>
          <span style={s.emptyIcon}>🎯</span>
          <p style={s.emptyTitle}>No goal set yet</p>
          <p style={s.emptySubtitle}>Fill in the form above to set your weight goal</p>
        </div>
      )}

      <div style={s.card}>
        <h3 style={s.cardTitle}>Log today's weight</h3>
        <div style={s.row}>
          <input style={s.input} type="number" placeholder="Weight in kg" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLog()} min="0" max="500" />
          <button style={s.addBtn} onClick={addLog}>Add</button>
        </div>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>History</h3>
        {logsDesc.length === 0 ? (
          <div style={s.emptyInline}>
            <span style={{ fontSize: 24, opacity: 0.4 }}>⚖️</span>
            <p style={s.emptyInlineText}>No weight logs yet — add your first entry above</p>
          </div>
        ) : (
          logsDesc.map((l) => (
            <div key={l.id} style={s.historyRow}>
              <span style={s.dateText}>{fmtDate(l.date)}</span>
              <span style={s.weightText}>{l.weight} kg</span>
              <button style={s.deleteBtn} onClick={() => deleteLog(l.id)}>✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LabeledInput({ label, type = "text", value, onChange, error, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={s.label}>{label}</label>
      <input style={{ ...s.input, borderColor: error ? "var(--color-border-danger)" : undefined }} type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      {error && <span style={s.errorText}>{error}</span>}
    </div>
  );
}

const s = {
  container: { padding: "20px 20px 40px", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, color: "var(--color-text-primary)" },
  title: { fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" },
  card: { background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: 600, margin: 0 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 },
  input: { padding: "9px 12px", borderRadius: 8, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" },
  errorText: { fontSize: 11, color: "var(--color-text-danger)" },
  formActions: { display: "flex", gap: 8, paddingTop: 4 },
  saveBtn: { background: "var(--color-background-success)", color: "var(--color-text-success)", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 },
  cancelBtn: { background: "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-secondary)", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  subtext: { fontSize: 13, color: "var(--color-text-secondary)", textAlign: "center", margin: 0 },
  bigNumber: { fontSize: 42, fontWeight: 700, textAlign: "center", lineHeight: 1, padding: "16px 0" },
  row: { display: "flex", gap: 10 },
  addBtn: { padding: "9px 18px", background: "var(--color-background-success)", color: "var(--color-text-success)", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" },
  historyRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border-tertiary)" },
  dateText: { fontSize: 13, color: "var(--color-text-secondary)", flex: 1 },
  weightText: { fontSize: 14, fontWeight: 500, marginRight: 12, color: "var(--color-text-primary)" },
  deleteBtn: { background: "none", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", fontSize: 13, padding: "2px 6px", borderRadius: 4 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "40px 20px", background: "var(--color-background-secondary)", border: "1px dashed var(--color-border-secondary)", borderRadius: 16, textAlign: "center" },
  emptyIcon: { fontSize: 32, opacity: 0.5 },
  emptyTitle: { fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text-secondary)" },
  emptySubtitle: { fontSize: 13, margin: 0, color: "var(--color-text-tertiary)" },
  emptyInline: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 0", textAlign: "center" },
  emptyInlineText: { fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 },
};
