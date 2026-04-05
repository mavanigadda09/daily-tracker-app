import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function Habits({ items = [], setItems }) {

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [targetDays, setTargetDays] = useState(30);
  const [view, setView] = useState("today");
  const [selectedHabit, setSelectedHabit] = useState(null);

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
        const alreadyDone = completed[todayKey];

        if (alreadyDone) {
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

  // ===== DELETE (FIXED CLEAN) =====
  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ===== EDIT =====
  const editHabit = (id) => {
    const newName = prompt("Edit habit name");
    if (!newName) return;

    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, name: newName } : i
      )
    );
  };

  // ===== PROGRESS =====
  const getProgress = (habit) => {
    const total = habit.targetDays || 30;
    const done = Object.keys(habit.completed || {}).length;

    return {
      percent: Math.min(100, (done / total) * 100),
      done,
      total
    };
  };

  // ===== SPLIT =====
  const completedHabits = habits.filter(h => h.completed?.[todayKey]);
  const pendingHabits = habits.filter(h => !h.completed?.[todayKey]);

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* VIEW SWITCH */}
      <div style={styles.tabs}>
        {["today", "week", "month"].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              ...styles.tab,
              ...(view === v ? styles.activeTab : {})
            }}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ADD FORM */}
      <form onSubmit={handleSubmit} style={styles.addBox}>
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
      </form>

      {/* PENDING */}
      <h3>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h, i) => {
          const progress = getProgress(h);
          const bg = colors[i % colors.length];

          return (
            <motion.div
              key={h.id}
              style={{ ...styles.card, background: bg }}
              whileHover={{ scale: 1.02 }}
            >
              <div style={styles.cardTop}>
                <div onClick={() => setSelectedHabit(h)}>
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

              <p>{progress.done}/{progress.total} days</p>

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
          const progress = getProgress(h);
          const bg = colors[i % colors.length];

          return (
            <motion.div key={h.id} style={{ ...styles.card, background: bg }}>
              <h3>{h.name}</h3>
              <p>Completed ✔</p>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL */}
      {selectedHabit && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h2>{selectedHabit.name}</h2>
            <p>🔥 Streak: {selectedHabit.streak}</p>
            <p>⭐ XP: {selectedHabit.xp}</p>

            <button onClick={() => setSelectedHabit(null)}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: { padding: 24, maxWidth: 900, margin: "0 auto" },

  title: { fontSize: 28, marginBottom: 20 },

  tabs: { display: "flex", gap: 10, marginBottom: 10 },

  tab: {
    padding: 8,
    borderRadius: 8,
    border: "1px solid #333"
  },

  activeTab: {
    background: "#22c55e",
    color: "#fff"
  },

  addBox: { display: "flex", gap: 10, marginBottom: 20 },

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

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
    gap: 16
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
  },

  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  modalCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 12
  }
};