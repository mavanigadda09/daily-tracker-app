import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useHabits, isHabitCompleted, getDateKey } from "../hooks/useHabits";

const fmtTick = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

export default function Habits({ items = [], setItems, weightLogs = [] }) {
  const todayKey = getDateKey();
  const [view, setView] = useState("day");
  const [newName, setNewName] = useState("");

  const { habits, toggleHabit, addHabit, deleteHabit, editHabit } =
    useHabits(items, setItems);

  const { pending, completed } = useMemo(() => {
    const done = [];
    const todo = [];
    habits.forEach((h) => {
      (isHabitCompleted(h, view, todayKey) ? done : todo).push(h);
    });
    return { pending: todo, completed: done };
  }, [habits, view, todayKey]);

  const totalXP = useMemo(
    () => habits.reduce((s, h) => s + (h.xp || 0), 0),
    [habits]
  );

  const chartData = useMemo(
    () =>
      [...weightLogs]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((w) => ({ date: w.date, weight: w.weight })),
    [weightLogs]
  );

  const handleAdd = () => {
    addHabit(newName);
    setNewName("");
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>Health & Habits</h2>

      {/* VIEW TABS */}
      <div style={s.tabs} role="tablist">
        {["day", "week", "month"].map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            style={{ ...s.tab, ...(view === v ? s.activeTab : {}) }}
            onClick={() => setView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* SUMMARY BAR */}
      <div style={s.summary}>
        <span style={s.summaryItem}>
          <b>{completed.length}</b> / {habits.length} done
        </span>
        <span style={s.summaryItem}>
          <b>{totalXP}</b> XP total
        </span>
      </div>

      {/* ADD HABIT */}
      <div style={s.addRow}>
        <input
          style={s.input}
          value={newName}
          placeholder="New habit name…"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button style={s.addBtn} onClick={handleAdd}>
          Add
        </button>
      </div>

      {/* EMPTY STATES */}
      {habits.length === 0 && (
        <p style={s.empty}>No habits yet — add one above</p>
      )}
      {habits.length > 0 && pending.length === 0 && (
        <p style={s.empty}>All habits complete for this {view} 🎉</p>
      )}

      {/* PENDING HABITS GRID */}
      <div style={s.grid}>
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

      {/* COMPLETED */}
      {completed.length > 0 && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Completed</h3>
          {completed.map((h) => (
            <CompletedRow
              key={h.id}
              habit={h}
              onUndo={() => toggleHabit(h.id)}
              onDelete={() => deleteHabit(h.id)}
            />
          ))}
        </div>
      )}

      {/* WEIGHT TREND — display only */}
      {chartData.length > 1 && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Weight trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--color-border-tertiary)" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtTick}
                interval={Math.max(0, Math.floor(chartData.length / 7) - 1)}
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-background-secondary)",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                dataKey="weight"
                stroke="var(--color-text-info)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── HabitCard ─────────────────────────────────────────────────────────────────

function HabitCard({ habit, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(habit.name);

  const handleSave = () => {
    if (editValue.trim()) onEdit(editValue);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.97 }}
      style={s.habitCard}
    >
      {editing ? (
        <div style={s.editRow}>
          <input
            style={{ ...s.input, flex: 1 }}
            value={editValue}
            autoFocus
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <button style={s.saveEditBtn} onClick={handleSave}>Save</button>
          <button style={s.cancelEditBtn} onClick={() => setEditing(false)}>✕</button>
        </div>
      ) : (
        <h3 style={s.habitName}>{habit.name}</h3>
      )}

      <div style={s.habitMeta}>
        <span style={s.streak}>
          {habit.streak > 0 ? `${habit.streak}d streak` : "No streak yet"}
        </span>
        <span style={s.xp}>{habit.xp || 0} XP</span>
      </div>

      <div style={s.cardActions}>
        <button style={s.doneBtn} onClick={onToggle} aria-label="Mark complete">
          Done
        </button>
        <button
          style={s.iconBtn}
          onClick={() => { setEditing(true); setEditValue(habit.name); }}
          aria-label="Edit habit"
        >
          ✏️
        </button>
        <button
          style={s.iconBtn}
          onClick={onDelete}
          aria-label="Delete habit"
        >
          🗑
        </button>
      </div>
    </motion.div>
  );
}

// ─── CompletedRow ──────────────────────────────────────────────────────────────

function CompletedRow({ habit, onUndo, onDelete }) {
  return (
    <div style={s.completedRow}>
      <span style={s.completedName}>{habit.name}</span>
      <div style={s.completedActions}>
        <span style={s.xpBadge}>+{habit.xp || 0} XP</span>
        <button style={s.undoBtn} onClick={onUndo}>Undo</button>
        <button
          style={s.iconBtn}
          onClick={onDelete}
          aria-label="Delete habit"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = {
  container: {
    padding: 20,
    color: "var(--color-text-primary)",
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 16,
  },
  tabs: {
    display: "flex",
    gap: 6,
    marginBottom: 14,
  },
  tab: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid var(--color-border-secondary)",
    background: "transparent",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
  activeTab: {
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    borderColor: "transparent",
  },
  summary: {
    display: "flex",
    gap: 20,
    marginBottom: 14,
    fontSize: 14,
  },
  summaryItem: {
    color: "var(--color-text-secondary)",
  },
  addRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    fontSize: 14,
  },
  addBtn: {
    padding: "8px 16px",
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  empty: {
    color: "var(--color-text-tertiary)",
    fontSize: 14,
    padding: "12px 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 14,
    marginBottom: 16,
  },
  habitCard: {
    padding: 16,
    borderRadius: 12,
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  habitName: {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
  },
  habitMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
  },
  streak: {
    color: "var(--color-text-warning)",
  },
  xp: {
    color: "var(--color-text-info)",
  },
  cardActions: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  doneBtn: {
    flex: 1,
    padding: "6px 0",
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    padding: "4px 6px",
    borderRadius: 4,
    color: "var(--color-text-tertiary)",
  },
  editRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  saveEditBtn: {
    padding: "6px 10px",
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  cancelEditBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--color-text-tertiary)",
    fontSize: 14,
    padding: "4px 6px",
  },
  card: {
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 10,
  },
  completedRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid var(--color-border-tertiary)",
  },
  completedName: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    textDecoration: "line-through",
  },
  completedActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  xpBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-text-info)",
    background: "var(--color-background-info)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  undoBtn: {
    background: "none",
    border: "1px solid var(--color-border-secondary)",
    borderRadius: 4,
    padding: "3px 8px",
    cursor: "pointer",
    fontSize: 12,
    color: "var(--color-text-secondary)",
  },
};