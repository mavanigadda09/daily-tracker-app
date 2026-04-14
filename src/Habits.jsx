import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { theme } from "./theme";
import { analyzeWeightWithHabits } from "./ai/ai";

/* ===== DATE ===== */
const getKey = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export default function Habits({
  items = [],
  setItems,
  weightLogs = [],
  addWeight
}) {

  const todayKey = getKey(new Date());

  /* ================= STORAGE ================= */
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      const saved = localStorage.getItem("habits");
      if (saved && items.length === 0) {
        setItems(JSON.parse(saved));
      }
      hydrated.current = true;
    }
  }, [items]);

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(items));
  }, [items]);

  /* ================= VIEW ================= */
  const [view, setView] = useState("day"); // day/week/month

  /* ================= HABITS ================= */
  const habits = items.filter(i => i.type === "habit");

  const completed = habits.filter(h => h.completed?.[todayKey]?.done);
  const pending = habits.filter(h => !h.completed?.[todayKey]?.done);

  const totalXP = habits.reduce((s, h) => s + (h.xp || 0), 0);

  /* ================= ADD ================= */
  const [name, setName] = useState("");

  const addHabit = () => {
    if (!name.trim()) return;

    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        type: "habit",
        completed: {},
        xp: 0,
        streak: 0
      }
    ]);

    setName("");
  };

  /* ================= ACTIONS ================= */
  const toggleHabit = (id) => {
    setItems(prev =>
      prev.map(h => {
        if (h.id !== id) return h;

        return {
          ...h,
          completed: {
            ...h.completed,
            [todayKey]: { done: true }
          },
          xp: h.xp + 10,
          streak: (h.streak || 0) + 1
        };
      })
    );
  };

  const deleteHabit = (id) => {
    setItems(prev => prev.filter(h => h.id !== id));
  };

  const editHabit = (id, newName) => {
    setItems(prev =>
      prev.map(h =>
        h.id === id ? { ...h, name: newName } : h
      )
    );
  };

  /* ================= WEIGHT ================= */
  const [weightInput, setWeightInput] = useState("");

  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem("weightGoal");
    return saved ? JSON.parse(saved) : {
      start: "",
      target: "",
      duration: ""
    };
  });

  useEffect(() => {
    localStorage.setItem("weightGoal", JSON.stringify(goal));
  }, [goal]);

  const handleAddWeight = () => {
    const num = Number(weightInput);
    if (!num) return;

    addWeight(num);
    setWeightInput("");
  };

  const sorted = [...weightLogs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const chartData = sorted.map(w => ({
    date: new Date(w.date).toLocaleDateString(),
    weight: w.weight
  }));

  const weightPercent = (() => {
    const start = Number(goal.start);
    const target = Number(goal.target);
    const current = sorted.at(-1)?.weight || start;

    const total = start - target;
    const progress = start - current;

    return total > 0 ? Math.min(Math.round((progress / total) * 100), 100) : 0;
  })();

  /* ================= AI ================= */
  const insight = analyzeWeightWithHabits({
    weightLogs: sorted,
    habits
  });

  /* ================= UI ================= */
  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Health & Habits</h1>

      {/* VIEW SWITCH */}
      <div style={styles.tabs}>
        {["day", "week", "month"].map(v => (
          <button
            key={v}
            style={{
              ...styles.tab,
              ...(view === v && styles.activeTab)
            }}
            onClick={() => setView(v)}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* SUMMARY */}
      <div style={styles.summary}>
        <div>XP: {totalXP}</div>
        <div>Completed: {completed.length}</div>
      </div>

      {/* ADD */}
      <div style={styles.addRow}>
        <input
          style={styles.input}
          value={name}
          placeholder="New habit..."
          onChange={(e) => setName(e.target.value)}
        />
        <button style={styles.button} onClick={addHabit}>Add</button>
      </div>

      {/* PENDING */}
      <div style={styles.card}>
        <h3>🕒 Pending</h3>

        {pending.map(h => (
          <motion.div key={h.id} style={styles.habitCard}>
            <div>
              <strong>{h.name}</strong>
              <p style={styles.meta}>🔥 {h.streak} streak</p>
            </div>

            <div style={styles.actions}>
              <button onClick={() => toggleHabit(h.id)}>✅</button>
              <button onClick={() => {
                const n = prompt("Edit habit", h.name);
                if (n) editHabit(h.id, n);
              }}>✏️</button>
              <button onClick={() => deleteHabit(h.id)}>🗑</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* COMPLETED */}
      <div style={styles.card}>
        <h3>✅ Completed</h3>

        {completed.map(h => (
          <div key={h.id} style={{ ...styles.habitCard, opacity: 0.6 }}>
            {h.name}
          </div>
        ))}
      </div>

      {/* WEIGHT */}
      <div style={styles.card}>
        <h3>⚖️ Weight Goal</h3>

        <div style={styles.goalGrid}>
          <input
            placeholder="Start"
            value={goal.start}
            onChange={(e) =>
              setGoal({ ...goal, start: e.target.value })
            }
          />
          <input
            placeholder="Target"
            value={goal.target}
            onChange={(e) =>
              setGoal({ ...goal, target: e.target.value })
            }
          />
          <input
            placeholder="Months"
            value={goal.duration}
            onChange={(e) =>
              setGoal({ ...goal, duration: e.target.value })
            }
          />
        </div>

        <p>Progress: {weightPercent}%</p>

        <input
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          placeholder="Daily weight"
        />
        <button onClick={handleAddWeight}>Add</button>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={theme.colors.border} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="weight" stroke={theme.colors.primary} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* AI */}
      {insight && (
        <div style={styles.card}>
          <h3>🧠 Insight</h3>
          <p>{insight}</p>
        </div>
      )}

    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: { padding: 20 },

  title: { color: theme.colors.primary },

  tabs: { display: "flex", gap: 10, marginBottom: 10 },

  tab: { padding: 6, cursor: "pointer" },
  activeTab: { background: theme.colors.primary, color: "#000" },

  summary: { display: "flex", gap: 20 },

  addRow: { display: "flex", gap: 10, marginBottom: 10 },

  card: {
    ...theme.components.card,
    marginBottom: 20
  },

  habitCard: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    marginTop: 8,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 10
  },

  actions: { display: "flex", gap: 8 },

  meta: { fontSize: 12, color: theme.colors.textMuted },

  goalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10
  },

  input: theme.components.input,
  button: theme.components.button.primary
};