import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function Habits({ items = [], setItems }) {

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const [showForm, setShowForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);

  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [targetDays, setTargetDays] = useState(30);

  const [view, setView] = useState("today");

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const todayKey = getKey(new Date());

  // ===== DATE RANGE =====
  const getDates = () => {
    const dates = [];
    const today = new Date();

    const range = view === "today" ? 1 : view === "week" ? 7 : 30;

    for (let i = 0; i < range; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.unshift(d);
    }

    return dates;
  };

  const dates = getDates();

  // ===== FIXED FILTER =====
  const isCompletedInView = (habit) => {
    return dates.some(d => habit.completed?.[getKey(d)]);
  };

  const completedHabits = habits.filter(isCompletedInView);
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

    const newHabit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type: "habit",
      completed: {},
      xp: 0,
      streak: 0,
      time,
      targetDays: Number(targetDays),
      startDate: Date.now() // ✅ important
    };

    setItems(prev => [...prev, newHabit]);

    setName("");
    setTime("");
    setTargetDays(30);
    setShowForm(false);
  };

  // ===== TOGGLE =====
  const toggleDay = (id) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };

        if (completed[todayKey]) {
          delete completed[todayKey];
        } else {
          completed[todayKey] = true;
        }

        return {
          ...item,
          completed,
          xp: (item.xp || 0) + 10,
          streak: (item.streak || 0) + 1
        };
      })
    );
  };

  // ===== DELETE (FIXED) =====
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

  // ===== PROGRESS BASED ON VIEW =====
  const getProgress = (habit) => {
    const done = dates.filter(d => habit.completed?.[getKey(d)]).length;
    const total = dates.length;

    return Math.round((done / total) * 100);
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

      {/* CREATE */}
      {!showForm && (
        <div style={styles.createCard} onClick={() => setShowForm(true)}>
          ➕ Create Habit
        </div>
      )}

      {showForm && (
        <div style={styles.form}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit"/>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}/>
          <input type="number" value={targetDays} onChange={(e) => setTargetDays(e.target.value)}/>
          <button onClick={addHabit}>Add</button>
        </div>
      )}

      {/* PENDING */}
      <h3>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h, i) => (
          <div key={h.id} style={{ ...styles.card, background: colors[i % 4] }}>

            <div onClick={() => setSelectedHabit(h)}>
              <h3>{h.name}</h3>
              <p>🔥 {h.streak} | ⭐ {h.xp}</p>
            </div>

            <div style={styles.row}>
              {dates.map((d, idx) => {
                const key = getKey(d);
                const done = h.completed?.[key];

                return (
                  <div
                    key={idx}
                    onClick={() => key === todayKey && toggleDay(h.id)}
                    style={{
                      ...styles.box,
                      background: done ? "#22c55e" : "#1e293b"
                    }}
                  />
                );
              })}
            </div>

            <p>{getProgress(h)}% complete</p>

            <div>
              <button onClick={() => editHabit(h.id)}>✏️</button>
              <button onClick={() => deleteHabit(h.id)}>🗑</button>
            </div>

          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedHabit && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h2>{selectedHabit.name}</h2>
            <p>🔥 Streak: {selectedHabit.streak}</p>
            <p>⭐ XP: {selectedHabit.xp}</p>
            <button onClick={() => setSelectedHabit(null)}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: { padding: 24, maxWidth: 1000, margin: "auto" },
  title: { fontSize: 28 },

  tabs: { display: "flex", gap: 10, marginBottom: 20 },

  tab: { padding: 10, borderRadius: 10, background: "#111", color: "#aaa" },

  activeTab: { background: "#22c55e", color: "#fff" },

  createCard: {
    padding: 20,
    background: "#111",
    borderRadius: 16,
    marginBottom: 20,
    cursor: "pointer",
    textAlign: "center"
  },

  form: { display: "flex", gap: 10, marginBottom: 20 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
    gap: 16
  },

  card: { padding: 16, borderRadius: 16, color: "#fff" },

  row: { display: "flex", gap: 6, marginTop: 10 },

  box: { width: 16, height: 16, borderRadius: 4 },

  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  modalCard: { background: "#fff", padding: 20, borderRadius: 10 }
};