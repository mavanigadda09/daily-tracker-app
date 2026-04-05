import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function Habits({ items = [], setItems }) {

  const [view, setView] = useState("today");
  const [selectedHabit, setSelectedHabit] = useState(null);

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const todayKey = getKey(new Date());

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  // ===== ADD =====
  const addHabit = () => {
    const name = prompt("Enter habit");
    if (!name) return;

    setItems(prev => {
      const clean = prev.filter(i => i.type === "habit" || i.type !== "habit");

      return [
        ...clean,
        {
          id: crypto.randomUUID(),
          name,
          type: "habit",
          completed: {},
          xp: 0,
          streak: 0,
          targetDays: 30
        }
      ];
    });
  };

  // ===== TOGGLE =====
  const toggle = (id) => {
    setItems(prev =>
      prev.map(i => {
        if (i.id !== id) return i;

        const completed = { ...(i.completed || {}) };

        if (completed[todayKey]) {
          delete completed[todayKey];
          return { ...i, completed };
        }

        completed[todayKey] = true;

        return {
          ...i,
          completed,
          xp: (i.xp || 0) + 10,
          streak: (i.streak || 0) + 1
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
    const name = prompt("Edit habit name");
    if (!name) return;

    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, name } : i
      )
    );
  };

  // ===== FILTER =====
  const completed = habits.filter(h => h.completed?.[todayKey]);
  const pending = habits.filter(h => !h.completed?.[todayKey]);

  return (
    <div style={styles.container}>

      <h1>🔥 Habits</h1>

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

      {/* CREATE */}
      <button onClick={addHabit} style={styles.create}>
        + Create Habit
      </button>

      {/* PENDING */}
      <h3>Pending</h3>
      <div style={styles.grid}>
        {pending.map(h => (
          <Card
            key={h.id}
            h={h}
            toggle={toggle}
            deleteHabit={deleteHabit}
            editHabit={editHabit}
            open={() => setSelectedHabit(h)}
          />
        ))}
      </div>

      {/* COMPLETED */}
      <h3>Completed</h3>
      <div style={styles.grid}>
        {completed.map(h => (
          <Card
            key={h.id}
            h={h}
            toggle={toggle}
            deleteHabit={deleteHabit}
            editHabit={editHabit}
            open={() => setSelectedHabit(h)}
          />
        ))}
      </div>

      {/* DETAIL VIEW */}
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

// ===== CARD =====
function Card({ h, toggle, deleteHabit, editHabit, open }) {
  return (
    <motion.div style={styles.card} whileHover={{ scale: 1.05 }}>

      <h3 onClick={open} style={{ cursor: "pointer" }}>
        {h.name}
      </h3>

      <p>🔥 {h.streak}</p>
      <p>⭐ {h.xp}</p>

      <button onClick={() => toggle(h.id)}>Done</button>

      <div style={styles.actions}>
        <button onClick={() => editHabit(h.id)}>✏️</button>
        <button onClick={() => deleteHabit(h.id)}>🗑</button>
      </div>

    </motion.div>
  );
}

// ===== STYLES =====
const styles = {
  container: { padding: 20 },

  tabs: { display: "flex", gap: 10 },

  tab: {
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ccc"
  },

  activeTab: {
    background: "#22c55e",
    color: "#fff"
  },

  create: {
    margin: "10px 0",
    padding: 10,
    background: "#111",
    color: "#fff"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
    gap: 10
  },

  card: {
    padding: 15,
    background: "#111",
    color: "#fff",
    borderRadius: 12
  },

  actions: {
    display: "flex",
    gap: 10,
    marginTop: 10
  },

  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  modalCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 10
  }
};