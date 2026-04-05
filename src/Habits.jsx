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

  const today = new Date();
  const todayKey = getKey(today);

  const dayNames = ["S","M","T","W","T","F","S"];

  // ===== DATE GENERATION =====
  const getDates = () => {
    const dates = [];

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

  // ===== FILTER LOGIC =====
  const isCompletedInView = (habit) => {
    if (view === "today") return habit.completed?.[todayKey];

    if (view === "week")
      return dates.some(d => habit.completed?.[getKey(d)]);

    if (view === "month")
      return dates.some(d => habit.completed?.[getKey(d)]);

    return false;
  };

  const completedHabits = habits.filter(h => isCompletedInView(h));
  const pendingHabits = habits.filter(h => !isCompletedInView(h));

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
          return { ...item, completed };
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

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* VIEW SWITCH */}
      <div style={styles.tabs}>
        {["today", "week", "month"].map(v => (
          <motion.button
            key={v}
            onClick={() => setView(v)}
            whileTap={{ scale: 0.9 }}
            style={{
              ...styles.tab,
              ...(view === v ? styles.activeTab : {})
            }}
          >
            {v.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* CREATE CARD */}
      {!showForm && (
        <motion.div style={styles.createCard} onClick={() => setShowForm(true)}>
          ➕ Create Habit
        </motion.div>
      )}

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.horizontalForm}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit" style={styles.input}/>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={styles.input}/>
          <input type="number" value={targetDays} onChange={(e) => setTargetDays(e.target.value)} style={styles.input}/>
          <button type="submit" style={styles.addBtn}>Add</button>
        </form>
      )}

      {/* PENDING */}
      <h3>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h, i) => {
          const bg = colors[i % colors.length];

          return (
            <motion.div key={h.id} style={{ ...styles.card, background: bg }}>

              <div style={styles.cardTop}>
                <h3>{h.name}</h3>
                <div style={styles.actions}>
                  <button onClick={() => editHabit(h.id)}>✏️</button>
                  <button onClick={() => deleteHabit(h.id)}>🗑</button>
                </div>
              </div>

              {/* DATE ROW */}
              <div style={styles.dayRow}>
                {dates.map((d, index) => {
                  const key = getKey(d);
                  const done = h.completed?.[key];

                  return (
                    <div key={index} style={styles.dayWrapper}>
                      <span style={styles.dayLabel}>
                        {view === "month"
                          ? d.getDate()
                          : dayNames[d.getDay()]}
                      </span>

                      <div
                        onClick={() => key === todayKey && toggleDay(h.id)}
                        style={{
                          ...styles.dayBox,
                          background: done ? "#22c55e" : "#1e293b",
                          border: key === todayKey ? "2px solid #22c55e" : "none",
                          cursor: key === todayKey ? "pointer" : "default"
                        }}
                      />
                    </div>
                  );
                })}
              </div>

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
  container: { padding: 24, maxWidth: 1000, margin: "0 auto", color: "#fff" },

  title: { fontSize: 28, marginBottom: 20 },

  tabs: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
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
    borderRadius: 20
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between"
  },

  actions: {
    display: "flex",
    gap: 6
  },

  dayRow: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap"
  },

  dayWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },

  dayLabel: {
    fontSize: 10,
    marginBottom: 4,
    color: "#94a3b8"
  },

  dayBox: {
    width: 18,
    height: 18,
    borderRadius: 4
  }
};