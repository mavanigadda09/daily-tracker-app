/**
 * Habits.jsx — Premium Health & Habits Dashboard
 *
 * Architecture decisions:
 * - UI split into focused sub-components (no 350-line monolith)
 * - Logic stays in useHabits hook — untouched
 * - Progress rings are pure SVG — no extra deps
 * - Timeframe filtering fixed: day = today, week = last 7 days, month = last 30 days
 * - All styles use existing CSS vars — theme-safe
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { useHabits, isHabitCompleted, getDateKey } from "../hooks/useHabits";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWS = ["day", "week", "month"];

const VIEW_LABEL = { day: "Today", week: "This Week", month: "This Month" };

// ─── SVG Progress Ring ────────────────────────────────────────────────────────

function ProgressRing({ percent = 0, size = 80, stroke = 6, color = "var(--color-text-success)" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(percent / 100, 1);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="var(--color-border-tertiary)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

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

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({ habit, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(habit.name);

  const streakColor =
    habit.streak >= 7  ? "var(--color-text-warning)" :
    habit.streak >= 3  ? "var(--color-text-info)"    :
                         "var(--color-text-tertiary)";

  const handleSave = () => {
    if (editValue.trim()) onEdit(editValue.trim());
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -2 }}
      style={s.habitCard}
    >
      {/* Top row */}
      <div style={s.habitCardTop}>
        {editing ? (
          <div style={s.editRow}>
            <input
              style={s.editInput}
              value={editValue}
              autoFocus
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <button style={s.saveBtn} onClick={handleSave}>Save</button>
            <button style={s.ghostBtn} onClick={() => setEditing(false)}>✕</button>
          </div>
        ) : (
          <h3 style={s.habitName}>{habit.name}</h3>
        )}

        {/* Actions */}
        {!editing && (
          <div style={s.cardMenu}>
            <button
              style={s.ghostBtn}
              onClick={() => { setEditing(true); setEditValue(habit.name); }}
              aria-label="Edit"
            >✏️</button>
            <button style={s.ghostBtn} onClick={onDelete} aria-label="Delete">🗑</button>
          </div>
        )}
      </div>

      {/* Streak + XP */}
      <div style={s.habitMeta}>
        <span style={{ ...s.streakPill, color: streakColor, borderColor: streakColor }}>
          {habit.streak > 0 ? `${habit.streak}d streak` : "Start today"}
        </span>
        <span style={s.xpTag}>{habit.xp || 0} XP</span>
      </div>

      {/* Complete button */}
      <button style={s.completeBtn} onClick={onToggle}>
        Mark complete
      </button>
    </motion.div>
  );
}

// ─── Completed Row ────────────────────────────────────────────────────────────

function CompletedRow({ habit, onUndo, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={s.completedRow}
    >
      <div style={s.completedLeft}>
        <span style={s.checkmark}>✓</span>
        <span style={s.completedName}>{habit.name}</span>
      </div>
      <div style={s.completedRight}>
        <span style={s.xpBadge}>+{habit.xp || 0} XP</span>
        <button style={s.undoBtn} onClick={onUndo}>Undo</button>
        <button style={s.ghostBtn} onClick={onDelete} aria-label="Delete">🗑</button>
      </div>
    </motion.div>
  );
}

// ─── Progress Overview ────────────────────────────────────────────────────────

function ProgressOverview({ habits, completed, pending, view }) {
  const total = habits.length;
  const doneCount = completed.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const totalXP = habits.reduce((s, h) => s + (h.xp || 0), 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  const ringColor =
    percent === 100 ? "var(--color-text-success)" :
    percent >= 50   ? "var(--color-text-info)"    :
                      "var(--color-text-warning)";

  return (
    <div style={s.progressCard}>
      {/* Ring + label */}
      <div style={s.ringSection}>
        <div style={s.ringWrap}>
          <ProgressRing percent={percent} size={96} stroke={8} color={ringColor} />
          <div style={s.ringLabel}>
            <span style={{ ...s.ringPercent, color: ringColor }}>{percent}%</span>
            <span style={s.ringSub}>done</span>
          </div>
        </div>
        <div style={s.ringMeta}>
          <p style={s.ringMetaTitle}>{VIEW_LABEL[view]} Progress</p>
          <p style={s.ringMetaSub}>
            {doneCount} of {total} habit{total !== 1 ? "s" : ""} complete
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={s.statsRow}>
        <div style={s.statBox}>
          <span style={s.statNum}>{totalXP}</span>
          <span style={s.statLabel}>Total XP</span>
        </div>
        <div style={s.statDivider} />
        <div style={s.statBox}>
          <span style={s.statNum}>{bestStreak}d</span>
          <span style={s.statLabel}>Best streak</span>
        </div>
        <div style={s.statDivider} />
        <div style={s.statBox}>
          <span style={s.statNum}>{pending.length}</span>
          <span style={s.statLabel}>Remaining</span>
        </div>
      </div>
    </div>
  );
}

// ─── Weight Section ───────────────────────────────────────────────────────────

function WeightSection({ weightLogs = [] }) {
  const sorted = useMemo(
    () => [...weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [weightLogs]
  );

  if (sorted.length < 2) return null;

  const latest = sorted[sorted.length - 1]?.weight;
  const earliest = sorted[0]?.weight;
  const delta = latest && earliest ? (latest - earliest).toFixed(1) : null;
  const deltaPositive = delta > 0;

  const fmtTick = (d) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div style={s.weightCard}>
      <SectionHeader title="Weight trend" />

      {/* Summary row */}
      <div style={s.weightSummary}>
        <div style={s.weightStat}>
          <span style={s.weightNum}>{latest} kg</span>
          <span style={s.weightLabel}>Current</span>
        </div>
        {delta !== null && (
          <div style={s.weightStat}>
            <span style={{
              ...s.weightNum,
              color: deltaPositive ? "var(--color-text-danger)" : "var(--color-text-success)",
            }}>
              {deltaPositive ? "+" : ""}{delta} kg
            </span>
            <span style={s.weightLabel}>Since start</span>
          </div>
        )}
        <div style={s.weightStat}>
          <span style={s.weightNum}>{sorted.length}</span>
          <span style={s.weightLabel}>Log entries</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={sorted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--color-border-tertiary)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={fmtTick}
            interval={Math.max(0, Math.floor(sorted.length / 6) - 1)}
            tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-background-secondary)",
              border: "1px solid var(--color-border-secondary)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-text-primary)",
            }}
            formatter={(v) => [`${v} kg`, "Weight"]}
            labelFormatter={fmtTick}
          />
          <Line
            dataKey="weight"
            stroke="var(--color-text-info)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-text-info)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Habits({ items = [], setItems, weightLogs = [] }) {
  const todayKey = getDateKey();
  const [view, setView] = useState("day");
  const [newName, setNewName] = useState("");

  const { habits, toggleHabit, addHabit, deleteHabit, editHabit } =
    useHabits(items, setItems);

  // Fixed filtering: correctly partitions by selected timeframe
  const { pending, completed } = useMemo(() => {
    const done = [];
    const todo = [];
    habits.forEach((h) => {
      (isHabitCompleted(h, view, todayKey) ? done : todo).push(h);
    });
    return { pending: todo, completed: done };
  }, [habits, view, todayKey]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addHabit(name);
    setNewName("");
  };

  return (
    <div style={s.page}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Health & Habits</h1>
          <p style={s.pageSubtitle}>
            {habits.length} habit{habits.length !== 1 ? "s" : ""} tracked
          </p>
        </div>

        {/* View selector */}
        <div style={s.viewTabs} role="tablist">
          {VIEWS.map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              style={{ ...s.viewTab, ...(view === v ? s.viewTabActive : {}) }}
              onClick={() => setView(v)}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Progress Overview ────────────────────────────────── */}
      {habits.length > 0 && (
        <ProgressOverview
          habits={habits}
          completed={completed}
          pending={pending}
          view={view}
        />
      )}

      {/* ── Add Habit ────────────────────────────────────────── */}
      <div style={s.addCard}>
        <input
          style={s.addInput}
          value={newName}
          placeholder="Add a new habit…"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          style={{ ...s.addBtn, opacity: newName.trim() ? 1 : 0.5 }}
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          Add habit
        </button>
      </div>

      {/* ── Today's Focus ─────────────────────────────────────── */}
      {pending.length > 0 && (
        <section>
          <SectionHeader title="Today's focus" count={pending.length} />
          <div style={s.habitGrid}>
            <AnimatePresence>
              {pending.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  onToggle={() => toggleHabit(h.id)}
                  onDelete={() => deleteHabit(h.id)}
                  onEdit={(name) => editHabit(h.id, name)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* All done state */}
      {habits.length > 0 && pending.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={s.allDoneCard}
        >
          <span style={s.allDoneIcon}>🏆</span>
          <p style={s.allDoneText}>All habits complete for {VIEW_LABEL[view].toLowerCase()}!</p>
        </motion.div>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <div style={s.emptyState}>
          <p style={s.emptyTitle}>No habits yet</p>
          <p style={s.emptySubtitle}>Add your first habit above to get started</p>
        </div>
      )}

      {/* ── Completed ─────────────────────────────────────────── */}
      {completed.length > 0 && (
        <section>
          <SectionHeader title="Completed" count={completed.length} />
          <div style={s.completedList}>
            <AnimatePresence>
              {completed.map((h) => (
                <CompletedRow
                  key={h.id}
                  habit={h}
                  onUndo={() => toggleHabit(h.id)}
                  onDelete={() => deleteHabit(h.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── Weight Trend ─────────────────────────────────────── */}
      <WeightSection weightLogs={weightLogs} />

    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  // Layout
  page: {
    padding: "20px 20px 40px",
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    color: "var(--color-text-primary)",
  },

  // Header
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.3px",
  },
  pageSubtitle: {
    fontSize: 13,
    color: "var(--color-text-tertiary)",
    margin: "4px 0 0",
  },

  // View tabs
  viewTabs: {
    display: "flex",
    gap: 4,
    background: "var(--color-background-secondary)",
    padding: 4,
    borderRadius: 10,
    border: "1px solid var(--color-border-tertiary)",
  },
  viewTab: {
    padding: "6px 14px",
    borderRadius: 7,
    border: "none",
    background: "transparent",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.15s ease",
  },
  viewTabActive: {
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  },

  // Progress card
  progressCard: {
    background: "var(--color-background-secondary)",
    borderRadius: 16,
    border: "1px solid var(--color-border-tertiary)",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  ringSection: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  ringWrap: {
    position: "relative",
    width: 96,
    height: 96,
    flexShrink: 0,
  },
  ringLabel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  ringPercent: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
  },
  ringSub: {
    fontSize: 10,
    color: "var(--color-text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  ringMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  ringMetaTitle: {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
  },
  ringMetaSub: {
    fontSize: 13,
    color: "var(--color-text-secondary)",
    margin: 0,
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    borderTop: "1px solid var(--color-border-tertiary)",
    paddingTop: 16,
  },
  statBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
  },
  statNum: {
    fontSize: 20,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 11,
    color: "var(--color-text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statDivider: {
    width: 1,
    height: 36,
    background: "var(--color-border-tertiary)",
  },

  // Add habit
  addCard: {
    display: "flex",
    gap: 10,
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: 12,
  },
  addInput: {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
  },
  addBtn: {
    padding: "9px 18px",
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },

  // Section header
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: "var(--color-text-tertiary)",
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: 600,
    background: "var(--color-background-info)",
    color: "var(--color-text-info)",
    padding: "1px 7px",
    borderRadius: 10,
  },

  // Habit grid
  habitGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
  },

  // Habit card
  habitCard: {
    padding: 16,
    borderRadius: 14,
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    cursor: "default",
    transition: "border-color 0.15s",
  },
  habitCardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  habitName: {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.3,
    flex: 1,
  },
  cardMenu: {
    display: "flex",
    gap: 2,
    flexShrink: 0,
  },
  habitMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  streakPill: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
    border: "1px solid",
  },
  xpTag: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-text-info)",
    background: "var(--color-background-info)",
    padding: "3px 8px",
    borderRadius: 20,
  },
  completeBtn: {
    width: "100%",
    padding: "8px 0",
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    transition: "opacity 0.15s",
  },

  // Edit row
  editRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flex: 1,
  },
  editInput: {
    flex: 1,
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    fontSize: 13,
    outline: "none",
    minWidth: 0,
  },
  saveBtn: {
    padding: "6px 10px",
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  ghostBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: "4px 6px",
    borderRadius: 4,
    color: "var(--color-text-tertiary)",
    lineHeight: 1,
  },

  // All done
  allDoneCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "32px 20px",
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 16,
    textAlign: "center",
  },
  allDoneIcon: { fontSize: 32 },
  allDoneText: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--color-text-success)",
    margin: 0,
  },

  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "var(--color-text-tertiary)",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: "0 0 6px",
    color: "var(--color-text-secondary)",
  },
  emptySubtitle: {
    fontSize: 13,
    margin: 0,
  },

  // Completed list
  completedList: {
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 12,
    overflow: "hidden",
  },
  completedRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid var(--color-border-tertiary)",
  },
  completedLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  checkmark: {
    fontSize: 13,
    color: "var(--color-text-success)",
    fontWeight: 700,
  },
  completedName: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    textDecoration: "line-through",
  },
  completedRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  xpBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-text-info)",
    background: "var(--color-background-info)",
    padding: "2px 7px",
    borderRadius: 10,
  },
  undoBtn: {
    background: "none",
    border: "1px solid var(--color-border-secondary)",
    borderRadius: 6,
    padding: "3px 10px",
    cursor: "pointer",
    fontSize: 12,
    color: "var(--color-text-secondary)",
  },

  // Weight card
  weightCard: {
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 16,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  weightSummary: {
    display: "flex",
    gap: 24,
  },
  weightStat: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  weightNum: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--color-text-primary)",
  },
  weightLabel: {
    fontSize: 11,
    color: "var(--color-text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
};