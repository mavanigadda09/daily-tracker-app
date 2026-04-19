import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHabits, getDateKey } from "../hooks/useHabits";

const VIEWS = ["day", "week", "month"];
const VIEW_LABEL = { day: "Today", week: "This Week", month: "This Month" };

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
const getTimeStatus = (time) => {
  if (!time) return null;

  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const t = new Date();
  t.setHours(h, m, 0, 0);

  const diff = t - now;

  if (diff > 0 && diff < 60 * 60 * 1000) return "soon";
  if (diff < 0 && Math.abs(diff) < 60 * 60 * 1000) return "missed";

  return null;
};

// ─────────────────────────────────────────
// Habit Card
// ─────────────────────────────────────────
function HabitCard({ habit, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(habit.name);

  const status = getTimeStatus(habit.time);
  const progress = habit.weekProgress || 0;

  return (
    <motion.div layout style={s.card}>
      <div style={s.row}>
        {editing ? (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => { onEdit(value); setEditing(false); }}
            style={s.input}
          />
        ) : (
          <h3>{habit.name}</h3>
        )}
        <div>
          <button onClick={() => setEditing(true)}>✏️</button>
          <button onClick={onDelete}>🗑</button>
        </div>
      </div>

      <div style={s.meta}>
        <span>🔥 {habit.streak}d</span>
        <span>{habit.xp} XP</span>
      </div>

      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      {habit.time && (
        <div style={{ fontSize: 12 }}>
          {status === "soon" && "⏳ Due soon"}
          {status === "missed" && "⚠️ Missed"}
          {!status && habit.time}
        </div>
      )}

      <button onClick={onToggle}>
        {habit.doneToday ? "Done ✓" : "Complete"}
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Main
// ─────────────────────────────────────────
export default function Habits({ items = [], setItems }) {
  const [view, setView] = useState("day");
  const [newName, setNewName] = useState("");

  const {
    habits,
    toggleHabit,
    addHabit,
    deleteHabit,
    editHabit,
    getPartitionedHabits,
  } = useHabits(items, setItems);

  const { pending, completed } = getPartitionedHabits(view);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHabit(newName);
    setNewName("");
  };

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <h1>Health & Habits</h1>
        <div>
          {VIEWS.map(v => (
            <button key={v} onClick={() => setView(v)}>
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Add */}
      <div style={s.addRow}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New habit..."
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* DAY */}
      {view === "day" && (
        <>
          <h3>Today's Focus</h3>
          <div style={s.grid}>
            {pending.map(h => (
              <HabitCard
                key={h.id}
                habit={h}
                onToggle={() => toggleHabit(h.id)}
                onDelete={() => deleteHabit(h.id)}
                onEdit={(name) => editHabit(h.id, name)}
              />
            ))}
          </div>
        </>
      )}

      {/* WEEK */}
      {view === "week" && (
        <div>
          <h3>Weekly Progress</h3>
          {habits.map(h => (
            <div key={h.id} style={s.weekRow}>
              <span>{h.name}</span>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${h.weekProgress}%` }} />
              </div>
              <span>{h.weekProgress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* MONTH */}
      {view === "month" && (
        <div>
          <h3>Monthly Overview</h3>
          <p>Analytics coming soon...</p>
        </div>
      )}

      {/* Completed */}
      <h3>Completed</h3>
      {completed.map(h => (
        <div key={h.id}>
          {h.name}
          <button onClick={() => toggleHabit(h.id)}>Undo</button>
        </div>
      ))}

    </div>
  );
}

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const s = {
  page: { padding: 20 },
  header: { display: "flex", justifyContent: "space-between" },
  addRow: { display: "flex", gap: 10, marginTop: 10 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 },
  card: { border: "1px solid #333", padding: 10, borderRadius: 8 },
  row: { display: "flex", justifyContent: "space-between" },
  meta: { display: "flex", justifyContent: "space-between" },
  progressBar: { height: 6, background: "#222", borderRadius: 6 },
  progressFill: { height: "100%", background: "#22c55e" },
  input: { width: "100%" },
  weekRow: { display: "flex", gap: 10, alignItems: "center" },
};