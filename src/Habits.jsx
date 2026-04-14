import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { theme } from "./theme";

/* ===== DATE UTILS ===== */
const getKey = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const isSameWeek = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  return diff <= 7 * 24 * 60 * 60 * 1000;
};

const isSameMonth = (date) => {
  const now = new Date();
  const d = new Date(date);
  return now.getMonth() === d.getMonth() &&
         now.getFullYear() === d.getFullYear();
};

export default function Habits({
  items = [],
  setItems,
  weightLogs = [],
  addWeight
}) {

  const todayKey = getKey(new Date());

  /* ================= STORAGE (FIXED) ================= */
  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("habits") || "[]");
    if (saved.length) setItems(saved);
  }, []);

  /* ================= VIEW ================= */
  const [view, setView] = useState("day");

  /* ================= HABITS ================= */
  const habits = items.filter(i => i.type === "habit");

  const isCompleted = (h) => {
    const entries = Object.entries(h.completed || {});

    if (view === "day") {
      return h.completed?.[todayKey]?.done;
    }

    if (view === "week") {
      return entries.some(([k]) => isSameWeek(k));
    }

    if (view === "month") {
      return entries.some(([k]) => isSameMonth(k));
    }
  };

  const completed = habits.filter(isCompleted);
  const pending = habits.filter(h => !isCompleted(h));

  const totalXP = habits.reduce((s, h) => s + (h.xp || 0), 0);

  /* ================= ADD ================= */
  const [name, setName] = useState("");

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
          xp: (h.xp || 0) + 10,
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
        h.id === id ? { ...h, name: newName.trim() } : h
      )
    );
  };

  /* ================= WEIGHT ================= */
  const [goal, setGoal] = useState({
    start: "",
    target: "",
    duration: ""
  });

  const [weightInput, setWeightInput] = useState("");

  const handleAddWeight = () => {
    const num = Number(weightInput);
    if (!num) return;
    addWeight(num);
    setWeightInput("");
  };

  const sorted = [...weightLogs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const current = sorted.length
    ? sorted[sorted.length - 1].weight
    : 0;

  const weightPercent = (() => {
    const start = Number(goal.start);
    const target = Number(goal.target);

    if (!start || !target) return 0;

    return Math.min(
      Math.round(((start - current) / (start - target)) * 100),
      100
    );
  })();

  const chartData = sorted.map(w => ({
    date: new Date(w.date).toLocaleDateString(),
    weight: w.weight
  }));

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
        <div>Done: {completed.length}</div>
      </div>

      {/* ADD */}
      <div style={styles.addRow}>
        <input
          style={styles.input}
          value={name}
          placeholder="New habit..."
          onChange={(e) => setName(e.target.value)}
        />
        <button style={styles.button} onClick={addHabit}>
          Add
        </button>
      </div>

      {/* HABIT GRID */}
      <div style={styles.grid}>
        {pending.map(h => (
          <motion.div key={h.id} style={styles.cardBig}>
            <h3>{h.name}</h3>
            <p>🔥 {h.streak || 0}</p>

            <div style={styles.actions}>
              <button onClick={() => toggleHabit(h.id)}>✅</button>
              <button onClick={() => {
                const n = prompt("Edit", h.name);
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
          <div key={h.id}>{h.name}</div>
        ))}
      </div>

      {/* WEIGHT */}
      <div style={styles.card}>
        <h3>⚖️ Weight Goal</h3>

        <div style={styles.goalGrid}>
          <input placeholder="Start" onChange={(e)=>setGoal({...goal,start:e.target.value})}/>
          <input placeholder="Target" onChange={(e)=>setGoal({...goal,target:e.target.value})}/>
          <input placeholder="Months" onChange={(e)=>setGoal({...goal,duration:e.target.value})}/>
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

    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: { padding: 20 },

  title: { color: theme.colors.primary },

  tabs: { display: "flex", gap: 10, marginBottom: 10 },

  tab: { padding: 6, cursor: "pointer" },
  activeTab: { background: "#22c55e", color: "#000" },

  summary: { display: "flex", gap: 20 },

  addRow: { display: "flex", gap: 10, marginBottom: 10 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16
  },

  cardBig: {
    padding: 16,
    borderRadius: 14,
    background: "#1e293b",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  },

  card: {
    ...theme.components.card,
    marginTop: 20
  },

  actions: { display: "flex", gap: 8, marginTop: 10 },

  goalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10
  },

  input: theme.components.input,
  button: theme.components.button.primary
};