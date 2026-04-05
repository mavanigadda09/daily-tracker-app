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

  // ✅ VIEW DATES
  const getDates = () => {
    const dates = [];
    const today = new Date();

    if (view === "today") {
      dates.push(new Date());
    }

    if (view === "week") {
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        dates.unshift(d);
      }
    }

    if (view === "month") {
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        dates.unshift(d);
      }
    }

    return dates;
  };

  const dates = getDates();

  // ✅ FIXED FILTER (MAIN FIX)
  const isCompletedInView = (habit) => {
    if (view === "today") {
      return habit.completed?.[todayKey];
    }

    return dates.some(d => habit.completed?.[getKey(d)]);
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
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit" style={styles.input}/>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={styles.input}/>
          <input type="number" value={targetDays} onChange={(e) => setTargetDays(e.target.value)} style={styles.input}/>
          <button type="submit" style={styles.addBtn}>Add</button>
          <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
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

              <div style={styles.dayRow}>
                {dates.map((d, index) => {
                  const key = getKey(d);
                  const done = h.completed?.[key];

                  return (
                    <div
                      key={index}
                      onClick={() => key === todayKey && toggleDay(h.id)}
                      style={{
                        ...styles.dayBox,
                        background: done ? "#22c55e" : "#1e293b",
                        opacity: key === todayKey ? 1 : 0.5,
                        cursor: key === todayKey ? "pointer" : "not-allowed"
                      }}
                    />
                  );
                })}
              </div>

              <div style={styles.progressTrack}>
                <motion.div style={styles.progressFill} animate={{ width: `${progress.percent}%` }}/>
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