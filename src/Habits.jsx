import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function Habits({ items = [], setItems }) {

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [targetDays, setTargetDays] = useState(30);
  const [view, setView] = useState("today");

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const todayKey = getKey(new Date());

  const colors = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#f97316,#fb7185)",
    "linear-gradient(135deg,#22c55e,#4ade80)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)"
  ];

  // ===== ADD =====
  const addHabit = () => {
    if (!name.trim()) return;

    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        type: "habit",
        completed: {},
        xp: 0,
        streak: 0,
        time,
        targetDays: Number(targetDays)
      }
    ]);

    setName("");
    setTime("");
    setTargetDays(30);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addHabit();
  };

  // ===== TOGGLE =====
  const toggleDay = (id) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };

        if (completed[todayKey]) {
          delete completed[todayKey];
          return {
            ...item,
            completed,
            xp: Math.max(0, (item.xp || 0) - 10),
            streak: 0
          };
        }

        completed[todayKey] = true;

        return {
          ...item,
          completed,
          xp: (item.xp || 0) + 10,
          streak: (item.streak || 0) + 1
        };
      })
    );
  };

  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const editHabit = (id) => {
    const newName = prompt("Edit habit name");
    if (!newName) return;

    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, name: newName } : i
      )
    );
  };

  const getProgress = (habit) => {
    const total = habit.targetDays || 30;
    const done = Object.keys(habit.completed || {}).length;

    return {
      percent: Math.min(100, (done / total) * 100),
      done,
      total
    };
  };

  const completedHabits = habits.filter(h => h.completed?.[todayKey]);
  const pendingHabits = habits.filter(h => !h.completed?.[todayKey]);

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* 🔥 PREMIUM VIEW SWITCH */}
      <div style={styles.tabs}>
        {["today", "week", "month"].map(v => (
          <motion.button
            key={v}
            onClick={() => setView(v)}
            whileTap={{ scale: 0.9 }}
            animate={{ scale: view === v ? 1.05 : 1 }}
            style={{
              ...styles.tab,
              ...(view === v ? styles.activeTab : {})
            }}
          >
            {v.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* CREATE BUTTON */}
      {!showForm && (
        <div style={styles.grid}>
          <motion.div
            style={styles.createCard}
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowForm(true)}
          >
            ➕ Create Habit
          </motion.div>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          style={styles.horizontalForm}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Habit"
            style={styles.input}
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={styles.input}
          />

          <input
            type="number"
            value={targetDays}
            onChange={(e) => setTargetDays(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.addBtn}>
            Add
          </button>

          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
        </motion.form>
      )}

      {/* PENDING */}
      <h3>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h, i) => {
          const progress = getProgress(h);
          const bg = colors[i % colors.length];

          return (
            <motion.div key={h.id} style={{ ...styles.card, background: bg }}>
              <div style={styles.cardTop}>
                <div>
                  <h3>{h.name}</h3>
                  <p>🔥 {h.streak}</p>
                  <p>⭐ {h.xp}</p>
                </div>

                <div style={styles.actions}>
                  <button onClick={() => editHabit(h.id)}>✏️</button>
                  <button onClick={() => deleteHabit(h.id)}>🗑</button>
                </div>
              </div>

              <div style={styles.progressTrack}>
                <motion.div
                  style={styles.progressFill}
                  animate={{ width: `${progress.percent}%` }}
                />
              </div>

              <button onClick={() => toggleDay(h.id)} style={styles.actionBtn}>
                Mark Done
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* COMPLETED */}
      <h3>Completed</h3>
      <div style={styles.grid}>
        {completedHabits.map((h, i) => {
          const bg = colors[i % colors.length];

          return (
            <motion.div key={h.id} style={{ ...styles.card, background: bg }}>
              <h3>{h.name}</h3>
              <p>Completed ✔</p>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: { padding: 24, maxWidth: 1000, margin: "0 auto" },

  title: { fontSize: 28, marginBottom: 20 },

  // 🔥 PREMIUM TABS
  tabs: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
    background: "#0f172a",
    padding: 6,
    borderRadius: 14,
    width: "fit-content"
  },

  tab: {
    padding: "10px 18px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease"
  },

  activeTab: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(34,197,94,0.4)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
    gap: 16
  },

  createCard: {
    padding: 20,
    borderRadius: 20,
    background: "#111",
    color: "#fff",
    textAlign: "center",
    cursor: "pointer"
  },

  horizontalForm: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap"
  },

  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #333",
    background: "#020617",
    color: "#fff"
  },

  addBtn: {
    background: "#22c55e",
    padding: "10px 16px",
    borderRadius: 10,
    color: "#fff"
  },

  cancelBtn: {
    background: "#ef4444",
    padding: "10px 16px",
    borderRadius: 10,
    color: "#fff"
  },

  card: {
    padding: 18,
    borderRadius: 20,
    color: "#fff"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between"
  },

  actions: {
    display: "flex",
    gap: 6
  },

  progressTrack: {
    height: 6,
    background: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    marginTop: 12
  },

  progressFill: {
    height: "100%",
    background: "#fff"
  },

  actionBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    background: "#fff",
    color: "#000"
  }
};