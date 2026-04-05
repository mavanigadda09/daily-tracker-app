import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function Habits({ items = [], setItems }) {

  const [selectedDate, setSelectedDate] = useState(new Date());

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const selectedKey = getKey(selectedDate);

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const colors = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#f97316,#fb7185)",
    "linear-gradient(135deg,#22c55e,#4ade80)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)"
  ];

  // ===== ADD =====
  const addHabit = (data) => {
    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "habit",
        completed: {},
        xp: 0,
        streak: 0,
        ...data
      }
    ]);
  };

  // ===== TOGGLE =====
  const toggleDay = (id) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };

        if (completed[selectedKey]) {
          delete completed[selectedKey];
          return { ...item, completed, streak: 0 };
        }

        completed[selectedKey] = true;

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
  const getProgress = (h) => {
    const done = Object.keys(h.completed || {}).length;
    const total = h.targetDays || 30;
    return Math.min(100, (done / total) * 100);
  };

  // ===== DATE STRIP =====
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 7 + i);
    return d;
  });

  // ===== SPLIT =====
  const completedHabits = habits.filter(h => h.completed?.[selectedKey]);
  const pendingHabits = habits.filter(h => !h.completed?.[selectedKey]);

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* DATE STRIP */}
      <div style={styles.dateStrip}>
        {days.map(d => {
          const key = getKey(d);
          const active = key === selectedKey;

          return (
            <div
              key={key}
              onClick={() => setSelectedDate(d)}
              style={{
                ...styles.dateCard,
                ...(active ? styles.activeDate : {})
              }}
            >
              <div>{d.getDate()}</div>
              <small>{["S","M","T","W","T","F","S"][d.getDay()]}</small>
            </div>
          );
        })}
      </div>

      {/* CREATE CARD */}
      <div style={styles.grid}>
        <div
          style={styles.createCard}
          onClick={() => {
            const name = prompt("Habit name?");
            if (!name) return;
            addHabit({ name, targetDays: 30 });
          }}
        >
          ➕ Create Habit
        </div>
      </div>

      {/* PENDING */}
      <h3 style={styles.section}>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h, i) => (
          <HabitCard
            key={h.id}
            h={h}
            bg={colors[i % colors.length]}
            toggleDay={toggleDay}
            deleteHabit={deleteHabit}
            progress={getProgress(h)}
          />
        ))}
      </div>

      {/* COMPLETED */}
      <h3 style={styles.section}>Completed</h3>
      <div style={styles.grid}>
        {completedHabits.map((h, i) => (
          <HabitCard
            key={h.id}
            h={h}
            bg={colors[i % colors.length]}
            toggleDay={toggleDay}
            deleteHabit={deleteHabit}
            progress={getProgress(h)}
          />
        ))}
      </div>

    </div>
  );
}

// ===== CARD COMPONENT =====
function HabitCard({ h, bg, toggleDay, deleteHabit, progress }) {

  return (
    <motion.div style={{ ...styles.card, background: bg }}>

      <div style={styles.cardTop}>
        <h3>{h.name}</h3>
        <div style={styles.menu}>
          <button onClick={() => deleteHabit(h.id)}>🗑</button>
        </div>
      </div>

      <p style={styles.sub}>🔥 {h.streak || 0} streak</p>
      <p style={styles.sub}>⭐ {h.xp || 0} XP</p>

      <div style={styles.progress}>
        <div style={{ ...styles.fill, width: `${progress}%` }} />
      </div>

      <button onClick={() => toggleDay(h.id)} style={styles.btn}>
        Mark Done
      </button>

    </motion.div>
  );
}

// ===== STYLES =====
const styles = {
  container: { padding: 20 },

  title: { fontSize: 28 },

  section: { marginTop: 20 },

  dateStrip: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    margin: "20px 0"
  },

  dateCard: {
    padding: 10,
    borderRadius: 10,
    background: "#111",
    color: "#fff",
    minWidth: 50,
    textAlign: "center",
    cursor: "pointer"
  },

  activeDate: {
    background: "#22c55e"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
    gap: 15
  },

  createCard: {
    padding: 20,
    borderRadius: 20,
    background: "#111",
    textAlign: "center",
    cursor: "pointer"
  },

  card: {
    padding: 16,
    borderRadius: 20,
    color: "#fff"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between"
  },

  sub: { fontSize: 12 },

  progress: {
    height: 6,
    background: "rgba(255,255,255,0.3)",
    marginTop: 10
  },

  fill: {
    height: "100%",
    background: "#fff"
  },

  btn: {
    marginTop: 10,
    padding: 8,
    borderRadius: 10
  }
};