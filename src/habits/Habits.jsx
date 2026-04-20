/**
 * Habits.jsx — Premium Health & Habits Dashboard
 *
 * Hook API (useHabits v2):
 *   - getPartitionedHabits(view) → { pending, completed }
 *   - enriched habits: doneToday, weekProgress, timeStatus,
 *     priorityScore, consistency, ageDays, streak, xp
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useHabits } from "../hooks/useHabits";

// ─── Constants ────────────────────────────────────────────────

const VIEWS = ["day", "week", "month"];
const VIEW_LABEL = { day: "Today", week: "This Week", month: "This Month" };

const TIME_STATUS_CONFIG = {
  soon:    { label: "Due soon",  color: "var(--color-text-warning)" },
  missed:  { label: "Missed",    color: "var(--color-text-danger)"  },
  overdue: { label: "Overdue",   color: "var(--color-text-danger)"  },
};

// ─── SVG Progress Ring ────────────────────────────────────────

function ProgressRing({ percent = 0, size = 88, stroke = 7, color }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(percent / 100, 1);
  const ringColor = color || (
    percent === 100 ? "var(--color-text-success)" :
    percent >= 50   ? "var(--color-text-info)"    :
                      "var(--color-text-warning)"
  );

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--color-border-tertiary)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={ringColor} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

// ─── Section Header ───────────────────────────────────────────

function SectionHeader({ title, count }) {
  return (
    <div style={s.sectionHeader}>
      <span style={s.sectionTitle}>{title}</span>
      {count !== undefined && (
        <span style={s.sectionBadge}>{count}</span>
      )}
    </div>
  );
}

// ─── Progress Overview (Day) ──────────────────────────────────

function DayOverview({ habits, pending, completed }) {
  const total = habits.length;
  const doneCount = completed.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const totalXP = habits.reduce((sum, h) => sum + (h.xp || 0), 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const overdueCount = pending.filter(
    h => h.timeStatus === "overdue" || h.timeStatus === "missed"
  ).length;

  return (
    <div style={s.overviewCard}>
      <div style={s.ringSection}>
        <div style={s.ringWrap}>
          <ProgressRing percent={percent} />
          <div style={s.ringCenter}>
            <span style={{
              ...s.ringPercent,
              color: percent === 100 ? "var(--color-text-success)" :
                     percent >= 50   ? "var(--color-text-info)"    :
                                       "var(--color-text-warning)",
            }}>{percent}%</span>
            <span style={s.ringSub}>done</span>
          </div>
        </div>
        <div style={s.ringMeta}>
          <p style={s.ringMetaTitle}>Today's Progress</p>
          <p style={s.ringMetaSub}>{doneCount} of {total} habits complete</p>
          {overdueCount > 0 && (
            <p style={{ ...s.ringMetaSub, color: "var(--color-text-danger)", marginTop: 4 }}>
              {overdueCount} overdue
            </p>
          )}
        </div>
      </div>

      <div style={s.statsRow}>
        {[
          { num: totalXP,          label: "Total XP"    },
          { num: `${bestStreak}d`, label: "Best streak" },
          { num: pending.length,   label: "Remaining"   },
        ].map(({ num, label }, i, arr) => (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={s.statBox}>
              <span style={s.statNum}>{num}</span>
              <span style={s.statLabel}>{label}</span>
            </div>
            {i < arr.length - 1 && <div style={s.statDivider} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────

function WeekView({ habits }) {
  const fullyDone = habits.filter(h => h.weekProgress === 100).length;

  return (
    <div style={s.weekCard}>
      <p style={s.weekSummary}>
        <b style={{ color: "var(--color-text-success)" }}>{fullyDone}</b>
        {" "}of {habits.length} habits fully completed this week
      </p>
      <div style={s.weekList}>
        {habits.map(h => (
          <div key={h.id} style={s.weekRow}>
            <span style={s.weekName}>{h.name}</span>
            <div style={s.weekBarTrack}>
              <motion.div
                style={s.weekBarFill}
                initial={{ width: 0 }}
                animate={{ width: `${h.weekProgress || 0}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span style={{
              ...s.weekPct,
              color: h.weekProgress === 100 ? "var(--color-text-success)" :
                     h.weekProgress >= 50   ? "var(--color-text-info)"    :
                                              "var(--color-text-tertiary)",
            }}>
              {h.weekProgress || 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────

function MonthView({ habits }) {
  const avgConsistency = habits.length
    ? Math.round(
        habits.reduce((sum, h) => sum + (h.consistency || 0), 0) / habits.length * 100
      )
    : 0;

  return (
    <div style={s.weekCard}>
      <p style={s.weekSummary}>
        Average consistency:{" "}
        <b style={{ color: "var(--color-text-info)" }}>{avgConsistency}%</b>
      </p>
      <div style={s.weekList}>
        {habits.map(h => {
          const pct = Math.round((h.consistency || 0) * 100);
          return (
            <div key={h.id} style={s.weekRow}>
              <span style={s.weekName}>{h.name}</span>
              <div style={s.weekBarTrack}>
                <motion.div
                  style={{
                    ...s.weekBarFill,
                    background: pct >= 80 ? "var(--color-text-success)" :
                                pct >= 50 ? "var(--color-text-info)"    :
                                            "var(--color-text-warning)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span style={s.weekPct}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Habit Card ───────────────────────────────────────────────

function HabitCard({ habit, onToggle, onDelete, onEdit }) {
  const [editing, setEditing]     = useState(false);
  const [editValue, setEditValue] = useState(habit.name);

  const timeInfo = TIME_STATUS_CONFIG[habit.timeStatus];
  const streakColor =
    habit.streak >= 7 ? "var(--color-text-warning)" :
    habit.streak >= 3 ? "var(--color-text-info)"    :
                        "var(--color-text-tertiary)";

  const handleSave = () => {
    if (editValue.trim()) onEdit(editValue.trim());
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -2 }}
      style={{
        ...s.habitCard,
        borderColor:
          habit.timeStatus === "overdue" || habit.timeStatus === "missed"
            ? "var(--color-border-danger)"
            : "var(--color-border-tertiary)",
      }}
    >
      <div style={s.habitTop}>
        {editing ? (
          <div style={s.editRow}>
            <input style={s.editInput} value={editValue} autoFocus
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter")  handleSave();
                if (e.key === "Escape") setEditing(false);
              }} />
            <button style={s.saveBtn} onClick={handleSave}>Save</button>
            <button style={s.ghostBtn} onClick={() => setEditing(false)}>✕</button>
          </div>
        ) : (
          <h3 style={s.habitName}>{habit.name}</h3>
        )}
        {!editing && (
          <div style={s.cardMenu}>
            <button style={s.ghostBtn} aria-label="Edit"
              onClick={() => { setEditing(true); setEditValue(habit.name); }}>✏️</button>
            <button style={s.ghostBtn} aria-label="Delete" onClick={onDelete}>🗑</button>
          </div>
        )}
      </div>

      {timeInfo && (
        <div style={{ fontSize: 11, fontWeight: 600, color: timeInfo.color }}>
          {timeInfo.label}{habit.time ? ` · ${habit.time}` : ""}
        </div>
      )}

      <div style={s.habitMeta}>
        <span style={{ ...s.streakPill, color: streakColor, borderColor: streakColor }}>
          {habit.streak > 0 ? `${habit.streak}d streak` : "Start today"}
        </span>
        <span style={s.xpTag}>{habit.xp || 0} XP</span>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)",
            textTransform: "uppercase", letterSpacing: "0.5px" }}>Week</span>
          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
            {habit.weekProgress || 0}%
          </span>
        </div>
        <div style={s.progressTrack}>
          <motion.div style={s.progressFill}
            initial={{ width: 0 }}
            animate={{ width: `${habit.weekProgress || 0}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }} />
        </div>
      </div>

      <button style={s.completeBtn} onClick={onToggle}>Mark complete</button>
    </motion.div>
  );
}

// ─── Completed Row ────────────────────────────────────────────

function CompletedRow({ habit, onUndo, onDelete }) {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={s.completedRow}>
      <div style={s.completedLeft}>
        <span style={s.checkmark}>✓</span>
        <span style={s.completedName}>{habit.name}</span>
        {habit.streak > 0 && (
          <span style={{ fontSize: 11, color: "var(--color-text-warning)" }}>
            {habit.streak}d
          </span>
        )}
      </div>
      <div style={s.completedRight}>
        <span style={s.xpBadge}>+{habit.xp || 0} XP</span>
        <button style={s.undoBtn} onClick={onUndo}>Undo</button>
        <button style={s.ghostBtn} aria-label="Delete" onClick={onDelete}>🗑</button>
      </div>
    </motion.div>
  );
}

// ─── Weight Section ───────────────────────────────────────────

function WeightSection({ weightLogs = [], addWeight, weightGoal, setWeightGoal }) {
  const [input, setInput]         = useState("");
  const [goalInput, setGoalInput] = useState(weightGoal ?? "");
  const [showGoal, setShowGoal]   = useState(false);

  const sorted = [...weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

  const latest   = sorted.length ? sorted[sorted.length - 1].weight : null;
  const earliest = sorted.length ? sorted[0].weight : null;
  const delta    = latest !== null && earliest !== null && sorted.length >= 2
    ? (latest - earliest).toFixed(1)
    : null;

  const fmtTick = (d) => {
    const x = new Date(d);
    return `${x.getDate()}/${x.getMonth() + 1}`;
  };

  const handleAdd = () => {
    const val = parseFloat(input);
    if (isNaN(val) || val <= 0 || val > 500) return;
    addWeight?.(val);
    setInput("");
  };

  const handleSetGoal = () => {
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0) setWeightGoal?.(val);
    setShowGoal(false);
  };

  const chartData = weightGoal
    ? sorted.map(entry => ({ ...entry, goal: weightGoal }))
    : sorted;

  return (
    <div style={s.weightCard}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionHeader title="Weight tracker" />
        <button
          style={{ ...s.ghostBtn, fontSize: 12, color: "var(--color-text-info)" }}
          onClick={() => setShowGoal(v => !v)}
        >
          {weightGoal ? `Goal: ${weightGoal} kg` : "Set goal"}
        </button>
      </div>

      {/* Goal input */}
      {showGoal && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            style={{ ...s.addInput, maxWidth: 140 }}
            type="number"
            placeholder="Target kg"
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSetGoal()}
          />
          <button style={s.saveBtn} onClick={handleSetGoal}>Set</button>
          <button style={s.ghostBtn} onClick={() => setShowGoal(false)}>✕</button>
        </div>
      )}

      {/* Log input — always visible */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          style={{ ...s.addInput, maxWidth: 160 }}
          type="number"
          placeholder="Log weight (kg)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <button
          style={{ ...s.addBtn, opacity: input.trim() ? 1 : 0.5 }}
          onClick={handleAdd}
          disabled={!input.trim()}
        >
          Log
        </button>
      </div>

      {/* Stats */}
      {sorted.length >= 1 && (
        <div style={s.weightSummary}>
          <div style={s.weightStat}>
            <span style={s.weightNum}>{latest} kg</span>
            <span style={s.weightLabel}>Current</span>
          </div>
          {delta !== null && (
            <div style={s.weightStat}>
              <span style={{
                ...s.weightNum,
                color: Number(delta) > 0
                  ? "var(--color-text-danger)"
                  : "var(--color-text-success)",
              }}>
                {Number(delta) > 0 ? "+" : ""}{delta} kg
              </span>
              <span style={s.weightLabel}>Since start</span>
            </div>
          )}
          {weightGoal && latest !== null && (
            <div style={s.weightStat}>
              <span style={{
                ...s.weightNum,
                color: latest <= weightGoal
                  ? "var(--color-text-success)"
                  : "var(--color-text-warning)",
              }}>
                {Math.abs(latest - weightGoal).toFixed(1)} kg
              </span>
              <span style={s.weightLabel}>
                {latest <= weightGoal ? "Below goal" : "To goal"}
              </span>
            </div>
          )}
          <div style={s.weightStat}>
            <span style={s.weightNum}>{sorted.length}</span>
            <span style={s.weightLabel}>Entries</span>
          </div>
        </div>
      )}

      {/* Chart — needs 2+ points */}
      {sorted.length >= 2 && (
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border-tertiary)"
              strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtTick}
              interval={Math.max(0, Math.floor(sorted.length / 6) - 1)}
              tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              width={40} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-background-secondary)",
                border: "1px solid var(--color-border-secondary)",
                borderRadius: 8, fontSize: 12, color: "var(--color-text-primary)",
              }}
              formatter={(v, name) => [`${v} kg`, name === "goal" ? "Goal" : "Weight"]}
              labelFormatter={fmtTick}
            />
            <Line dataKey="weight" stroke="var(--color-text-info)" strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: "var(--color-text-info)" }} />
            {weightGoal && (
              <Line dataKey="goal" stroke="var(--color-text-warning)"
                strokeWidth={1} strokeDasharray="4 4" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Empty state */}
      {sorted.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>
          Log your first weight entry above to start tracking.
        </p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────

export default function Habits({
  items = [],
  setItems,
  weightLogs = [],
  addWeight,
  weightGoal,
  setWeightGoal,
}) {
  const [view, setView]       = useState("day");
  const [newName, setNewName] = useState("");

  const { habits, toggleHabit, addHabit, deleteHabit, editHabit, getPartitionedHabits } =
    useHabits(items, setItems);

  const { pending, completed } = getPartitionedHabits(view);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addHabit(name);
    setNewName("");
  };

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Health & Habits</h1>
          <p style={s.pageSubtitle}>
            {habits.length} habit{habits.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <div style={s.viewTabs} role="tablist">
          {VIEWS.map(v => (
            <button key={v} role="tab" aria-selected={view === v}
              style={{ ...s.viewTab, ...(view === v ? s.viewTabActive : {}) }}
              onClick={() => setView(v)}>
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Day: progress ring */}
      {view === "day" && habits.length > 0 && (
        <DayOverview habits={habits} pending={pending} completed={completed} />
      )}

      {/* Add habit */}
      <div style={s.addCard}>
        <input style={s.addInput} value={newName}
          placeholder="Add a new habit…"
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()} />
        <button style={{ ...s.addBtn, opacity: newName.trim() ? 1 : 0.5 }}
          onClick={handleAdd} disabled={!newName.trim()}>
          Add habit
        </button>
      </div>

      {/* Week view */}
      {view === "week" && habits.length > 0 && (
        <section>
          <SectionHeader title="Weekly progress" count={habits.length} />
          <WeekView habits={habits} />
        </section>
      )}

      {/* Month view */}
      {view === "month" && habits.length > 0 && (
        <section>
          <SectionHeader title="Monthly consistency" count={habits.length} />
          <MonthView habits={habits} />
        </section>
      )}

      {/* Day: pending */}
      {view === "day" && pending.length > 0 && (
        <section>
          <SectionHeader title="Today's focus" count={pending.length} />
          <div style={s.habitGrid}>
            <AnimatePresence>
              {pending.map(h => (
                <HabitCard key={h.id} habit={h}
                  onToggle={() => toggleHabit(h.id)}
                  onDelete={() => deleteHabit(h.id)}
                  onEdit={name => editHabit(h.id, name)} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* All done */}
      {view === "day" && habits.length > 0 && pending.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={s.allDoneCard}>
          <span style={{ fontSize: 32 }}>🏆</span>
          <p style={s.allDoneText}>All habits complete for today!</p>
        </motion.div>
      )}

      {/* Empty */}
      {habits.length === 0 && (
        <div style={s.emptyState}>
          <p style={s.emptyTitle}>No habits yet</p>
          <p style={s.emptySubtitle}>Add your first habit above to get started</p>
        </div>
      )}

      {/* Completed (day only) */}
      {view === "day" && completed.length > 0 && (
        <section>
          <SectionHeader title="Completed" count={completed.length} />
          <div style={s.completedList}>
            <AnimatePresence>
              {completed.map(h => (
                <CompletedRow key={h.id} habit={h}
                  onUndo={() => toggleHabit(h.id)}
                  onDelete={() => deleteHabit(h.id)} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Weight tracker */}
      <WeightSection
        weightLogs={weightLogs}
        addWeight={addWeight}
        weightGoal={weightGoal}
        setWeightGoal={setWeightGoal}
      />

    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = {
  page: { padding: "20px 20px 40px", maxWidth: 900, margin: "0 auto",
    display: "flex", flexDirection: "column", gap: 20, color: "var(--color-text-primary)" },

  pageHeader:   { display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  pageTitle:    { fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" },
  pageSubtitle: { fontSize: 13, color: "var(--color-text-tertiary)", margin: "4px 0 0" },

  viewTabs:      { display: "flex", gap: 4, background: "var(--color-background-secondary)",
    padding: 4, borderRadius: 10, border: "1px solid var(--color-border-tertiary)" },
  viewTab:       { padding: "6px 14px", borderRadius: 7, border: "none",
    background: "transparent", color: "var(--color-text-secondary)",
    cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s ease" },
  viewTabActive: { background: "var(--color-background-primary)",
    color: "var(--color-text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" },

  overviewCard: { background: "var(--color-background-secondary)", borderRadius: 16,
    border: "1px solid var(--color-border-tertiary)", padding: "20px 24px",
    display: "flex", flexDirection: "column", gap: 20 },
  ringSection:  { display: "flex", alignItems: "center", gap: 20 },
  ringWrap:     { position: "relative", width: 88, height: 88, flexShrink: 0 },
  ringCenter:   { position: "absolute", inset: 0, display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 },
  ringPercent:  { fontSize: 18, fontWeight: 700, lineHeight: 1 },
  ringSub:      { fontSize: 10, color: "var(--color-text-tertiary)",
    textTransform: "uppercase", letterSpacing: "0.5px" },
  ringMeta:     { display: "flex", flexDirection: "column", gap: 4 },
  ringMetaTitle:{ fontSize: 15, fontWeight: 600, margin: 0 },
  ringMetaSub:  { fontSize: 13, color: "var(--color-text-secondary)", margin: 0 },

  statsRow:    { display: "flex", alignItems: "center",
    borderTop: "1px solid var(--color-border-tertiary)", paddingTop: 16 },
  statBox:     { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
  statNum:     { fontSize: 20, fontWeight: 700 },
  statLabel:   { fontSize: 11, color: "var(--color-text-tertiary)",
    textTransform: "uppercase", letterSpacing: "0.5px" },
  statDivider: { width: 1, height: 36, background: "var(--color-border-tertiary)", margin: "0 8px" },

  addCard:  { display: "flex", gap: 10, background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)", borderRadius: 12, padding: 12 },
  addInput: { flex: 1, padding: "9px 12px", borderRadius: 8,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)", color: "var(--color-text-primary)",
    fontSize: 14, outline: "none" },
  addBtn:   { padding: "9px 18px", background: "var(--color-background-success)",
    color: "var(--color-text-success)", border: "none", borderRadius: 8,
    cursor: "pointer", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" },

  sectionHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle:  { fontSize: 13, fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.6px", color: "var(--color-text-tertiary)" },
  sectionBadge:  { fontSize: 11, fontWeight: 600, background: "var(--color-background-info)",
    color: "var(--color-text-info)", padding: "1px 7px", borderRadius: 10 },

  habitGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  habitCard:    { padding: 16, borderRadius: 14, background: "var(--color-background-secondary)",
    border: "1px solid", display: "flex", flexDirection: "column", gap: 10 },
  habitTop:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  habitName:    { fontSize: 15, fontWeight: 600, margin: 0, lineHeight: 1.3, flex: 1 },
  cardMenu:     { display: "flex", gap: 2, flexShrink: 0 },
  habitMeta:    { display: "flex", alignItems: "center", justifyContent: "space-between" },
  streakPill:   { fontSize: 11, fontWeight: 600, padding: "3px 8px",
    borderRadius: 20, border: "1px solid" },
  xpTag:        { fontSize: 11, fontWeight: 600, color: "var(--color-text-info)",
    background: "var(--color-background-info)", padding: "3px 8px", borderRadius: 20 },
  progressTrack:{ height: 5, background: "var(--color-background-tertiary)",
    borderRadius: 6, overflow: "hidden" },
  progressFill: { height: "100%", background: "var(--color-text-info)", borderRadius: 6, minWidth: 2 },
  completeBtn:  { width: "100%", padding: "8px 0", background: "var(--color-background-success)",
    color: "var(--color-text-success)", border: "none", borderRadius: 8,
    cursor: "pointer", fontWeight: 600, fontSize: 13 },

  editRow:   { display: "flex", gap: 6, alignItems: "center", flex: 1 },
  editInput: { flex: 1, padding: "6px 10px", borderRadius: 6,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)", color: "var(--color-text-primary)",
    fontSize: 13, outline: "none", minWidth: 0 },
  saveBtn:   { padding: "6px 10px", background: "var(--color-background-success)",
    color: "var(--color-text-success)", border: "none", borderRadius: 6,
    cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  ghostBtn:  { background: "none", border: "none", cursor: "pointer", fontSize: 14,
    padding: "4px 6px", borderRadius: 4, color: "var(--color-text-tertiary)", lineHeight: 1 },

  allDoneCard:   { display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    padding: "32px 20px", background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)", borderRadius: 16, textAlign: "center" },
  allDoneText:   { fontSize: 15, fontWeight: 600, color: "var(--color-text-success)", margin: 0 },

  emptyState:    { textAlign: "center", padding: "40px 20px", color: "var(--color-text-tertiary)" },
  emptyTitle:    { fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: "var(--color-text-secondary)" },
  emptySubtitle: { fontSize: 13, margin: 0 },

  completedList: { background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" },
  completedRow:  { display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px", borderBottom: "1px solid var(--color-border-tertiary)" },
  completedLeft: { display: "flex", alignItems: "center", gap: 10 },
  checkmark:     { fontSize: 13, color: "var(--color-text-success)", fontWeight: 700 },
  completedName: { fontSize: 14, color: "var(--color-text-secondary)", textDecoration: "line-through" },
  completedRight:{ display: "flex", alignItems: "center", gap: 8 },
  xpBadge:       { fontSize: 11, fontWeight: 600, color: "var(--color-text-info)",
    background: "var(--color-background-info)", padding: "2px 7px", borderRadius: 10 },
  undoBtn:       { background: "none", border: "1px solid var(--color-border-secondary)",
    borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12,
    color: "var(--color-text-secondary)" },

  weekCard:     { background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)", borderRadius: 16, padding: "20px 24px" },
  weekSummary:  { fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 16px" },
  weekList:     { display: "flex", flexDirection: "column", gap: 12 },
  weekRow:      { display: "flex", alignItems: "center", gap: 12 },
  weekName:     { fontSize: 13, fontWeight: 500, width: 120, flexShrink: 0,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  weekBarTrack: { flex: 1, height: 6, background: "var(--color-background-tertiary)",
    borderRadius: 6, overflow: "hidden" },
  weekBarFill:  { height: "100%", background: "var(--color-text-info)",
    borderRadius: 6, minWidth: 2 },
  weekPct:      { fontSize: 12, fontWeight: 600, width: 36,
    textAlign: "right", color: "var(--color-text-secondary)" },

  weightCard:    { background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)", borderRadius: 16,
    padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 },
  weightSummary: { display: "flex", gap: 24, flexWrap: "wrap" },
  weightStat:    { display: "flex", flexDirection: "column", gap: 3 },
  weightNum:     { fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" },
  weightLabel:   { fontSize: 11, color: "var(--color-text-tertiary)",
    textTransform: "uppercase", letterSpacing: "0.5px" },
};