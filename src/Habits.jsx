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

  const [selectedDate, setSelectedDate] = useState(new Date());

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const activeKey = getKey(selectedDate);

  const dayNames = ["S","M","T","W","T","F","S"];

  // ===== DATE GENERATION =====
  const getDates = () => {
    const dates = [];
    const today = new Date();

    let range = 1;
    if (view === "week") range = 7;
    if (view === "month") range = 30;

    for (let i = 0; i < range; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (range - 1 - i));
      dates.push(d);
    }

    return dates;
  };

  const dates = getDates();

  // ===== FILTER =====
  const isCompleted = (habit) => habit.completed?.[activeKey];

  const completedHabits = habits.filter(h => isCompleted(h));
  const pendingHabits = habits.filter(h => !isCompleted(h));

  const completionRate = habits.length
    ? Math.round((completedHabits.length / habits.length) * 100)
    : 0;

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
  const toggleDay = (id, key) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };

        if (completed[key]) {
          delete completed[key];
          return { ...item, completed };
        }

        completed[key] = true;

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

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* COMPLETION RATE */}
      <h2 style={styles.progressText}>
        {completionRate}% completed today
      </h2>

      {/* VIEW SWITCH */}
      <div style={styles.tabs}>
        {["today", "week", "month"].map(v => (
          <motion.button
            key={v}
            onClick={() => setView(v)}
            style={{
              ...styles.tab,
              ...(view === v ? styles.activeTab : {})
            }}
            whileTap={{ scale: 0.95 }}
          >
            {v.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* DATE STRIP */}
      <div style={styles.dateRow}>
        {dates.map((d, i) => {
          const key = getKey(d);
          const isActive = key === activeKey;

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(d)}
              style={{
                ...styles.dateCard,
                background: isActive ? "#ef4444" : "#111"
              }}
            >
              <div>{d.getDate()}</div>
              <div style={{ fontSize: 10 }}>
                {dayNames[d.getDay()]}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE */}
      {!showForm && (
        <motion.div
          style={styles.createCard}
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.02 }}
        >
          ➕ Create Habit
        </motion.div>
      )}

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.horizontalForm}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit name" style={styles.input}/>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={styles.input}/>
          <input type="number" value={targetDays} onChange={(e) => setTargetDays(e.target.value)} style={styles.input}/>
          <button type="submit" style={styles.addBtn}>Add</button>
        </form>
      )}

      {/* EMPTY STATE */}
      {habits.length === 0 && (
        <div style={styles.empty}>
          No habits yet 🚀 Start building your streak!
        </div>
      )}

      {/* PENDING */}
      <h3>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h, i) => {
          const bg = colors[i % colors.length];

          return (
            <motion.div
              key={h.id}
              style={{ ...styles.card, background: bg }}
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={styles.cardTop}>
                <h3>{h.name}</h3>
                <div style={styles.actions}>
                  <button onClick={() => editHabit(h.id)}>✏️</button>
                  <button onClick={() => deleteHabit(h.id)}>🗑</button>
                </div>
              </div>

              <p>🔥 {h.streak} day streak</p>
              <p>⚡ {h.xp} XP</p>

              {/* PROGRESS */}
              <div style={styles.progressBar}>
                <div style={{
                  width: `${(h.streak / h.targetDays) * 100}%`,
                  ...styles.progressFill
                }} />
              </div>

              <button
                onClick={() => toggleDay(h.id, activeKey)}
                style={styles.actionBtn}
              >
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
            <motion.div
              key={h.id}
              style={{ ...styles.card, background: bg }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <h3>{h.name}</h3>
              <p>Completed ✔</p>
              <p>🔥 {h.streak} | ⚡ {h.xp}</p>

              <div style={styles.actions}>
                <button onClick={() => editHabit(h.id)}>✏️</button>
                <button onClick={() => deleteHabit(h.id)}>🗑</button>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: { padding: 24, maxWidth: 1000, margin: "0 auto", color: "#fff" },

  title: { fontSize: 28, marginBottom: 10 },

  progressText: { opacity: 0.7, marginBottom: 20 },

  tabs: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
    background: "#0f172a",
    padding: 6,
    borderRadius: 14
  },

  tab: {
    padding: "10px 18px",
    borderRadius: 10,
    background: "transparent",
    color: "#94a3b8",
    border: "none"
  },

  activeTab: {
    background: "#22c55e",
    color: "#fff"
  },

  dateRow: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    overflowX: "auto"
  },

  dateCard: {
    minWidth: 50,
    padding: 10,
    borderRadius: 12,
    textAlign: "center",
    cursor: "pointer"
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
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 20
  },

  horizontalForm: {
    display: "flex",
    gap: 10,
    marginBottom: 20
  },

  input: {
    padding: 10,
    borderRadius: 10,
    background: "#020617",
    color: "#fff",
    border: "none"
  },

  addBtn: {
    background: "#22c55e",
    padding: "10px 16px",
    borderRadius: 10,
    color: "#fff",
    border: "none"
  },

  card: {
    padding: 18,
    borderRadius: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between"
  },

  actions: {
    display: "flex",
    gap: 6,
    marginTop: 10
  },

  actionBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    background: "#fff",
    color: "#000",
    border: "none"
  },

  progressBar: {
    height: 6,
    background: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    marginTop: 10
  },

  progressFill: {
    height: "100%",
    background: "#fff",
    borderRadius: 10
  },

  empty: {
    textAlign: "center",
    opacity: 0.6,
    marginBottom: 20
  }
};