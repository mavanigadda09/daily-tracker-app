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

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const todayKey = getKey(new Date());

  // 🎨 COLORS (like reference UI)
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

  // ===== FIXED TOGGLE =====
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

  // ===== DELETE =====
  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
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

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

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

      {/* HABITS */}
      {habits.map((h, i) => {
        const progress = getProgress(h);
        const bg = colors[i % colors.length];

        return (
          <motion.div
            key={h.id}
            style={{ ...styles.card, background: bg }}
            whileHover={{ scale: 1.02 }}
          >

            {/* HEADER */}
            <div style={styles.cardTop}>
              <div>
                <h3 style={styles.cardTitle}>{h.name}</h3>
                <p style={styles.sub}>
                  🔥 {h.streak || 0} day streak
                </p>
                <p style={styles.sub}>
                  ⭐ {h.xp || 0} XP
                </p>
              </div>

              <div style={styles.circle}>
                {h.completed?.[todayKey] ? "✔" : ""}
              </div>
            </div>

            {/* PROGRESS */}
            <div style={styles.progressTrack}>
              <motion.div
                style={styles.progressFill}
                animate={{ width: `${progress.percent}%` }}
              />
            </div>

            <p style={styles.meta}>
              {progress.done} / {progress.total} days
            </p>

            {/* ACTION */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleDay(h.id)}
              style={styles.actionBtn}
            >
              {h.completed?.[todayKey]
                ? "Completed ✔"
                : "Mark Done"}
            </motion.button>

            <button
              onClick={() => deleteHabit(h.id)}
              style={styles.delete}
            >
              Delete
            </button>

          </motion.div>
        );
      })}

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: {
    padding: 24,
    maxWidth: 600,
    margin: "0 auto"
  },

  title: {
    fontSize: 28,
    marginBottom: 20
  },

  addBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20
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

  card: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    color: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between"
  },

  cardTitle: {
    fontSize: 18
  },

  sub: {
    fontSize: 12,
    opacity: 0.8
  },

  circle: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  progressTrack: {
    height: 6,
    background: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    marginTop: 12
  },

  progressFill: {
    height: "100%",
    background: "#fff",
    borderRadius: 10
  },

  meta: {
    fontSize: 12,
    marginTop: 6
  },

  actionBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#fff",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer"
  },

  delete: {
    marginTop: 8,
    background: "#ef4444",
    padding: 6,
    borderRadius: 6,
    color: "#fff",
    border: "none"
  }
};