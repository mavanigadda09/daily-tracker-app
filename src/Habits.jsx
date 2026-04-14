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

import {
  analyzeWeightWithHabits
} from "./ai/ai";

/* ===== DATE UTILS ===== */
const getKey = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export default function Habits({
  items = [],
  setItems,
  weightLogs = [],
  addWeight,
  weightGoal
}) {

  const hydrated = useRef(false);

  /* ================= LOCAL STORAGE ================= */
  useEffect(() => {
    if (!hydrated.current) {
      const saved = localStorage.getItem("habits");
      if (saved && items.length === 0) {
        setItems(JSON.parse(saved));
      }
      hydrated.current = true;
    }
  }, [items, setItems]);

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(items));
  }, [items]);

  /* ================= HABITS ================= */
  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const todayKey = getKey(new Date());

  const completedHabits = habits.filter(
    h => h.completed?.[todayKey]?.done
  );

  const completionRate = habits.length
    ? Math.round((completedHabits.length / habits.length) * 100)
    : 0;

  const totalXP = habits.reduce((sum, h) => sum + (h.xp || 0), 0);

  /* ================= WEIGHT ================= */
  const sorted = useMemo(() => {
    return [...weightLogs].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [weightLogs]);

  const start = sorted[0]?.weight || 0;
  const current = sorted[sorted.length - 1]?.weight || 0;
  const target = weightGoal || 0;

  const weightPercent = useMemo(() => {
    const totalDiff = start - target;
    const currentDiff = start - current;

    return totalDiff > 0
      ? Math.min(Math.round((currentDiff / totalDiff) * 100), 100)
      : 0;
  }, [start, current, target]);

  /* ================= AI ================= */
  const habitImpact = useMemo(() => {
    if (sorted.length < 3) return "";

    try {
      return analyzeWeightWithHabits({
        weightLogs: sorted,
        habits
      });
    } catch {
      return "";
    }
  }, [sorted, habits]);

  const aiInsight = useMemo(() => {
    if (completionRate > 70 && weightPercent > 50)
      return "🔥 Excellent consistency & progress!";
    if (completionRate < 30)
      return "⚠️ Improve habit consistency.";
    if (weightPercent < 30)
      return "📈 Focus more on health habits.";
    return "💪 Keep pushing forward!";
  }, [completionRate, weightPercent]);

  /* ================= ADD HABIT ================= */
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

  /* ================= TOGGLE ================= */
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
          xp: h.xp + 10
        };
      })
    );
  };

  /* ================= ADD WEIGHT ================= */
  const [weightInput, setWeightInput] = useState("");

  const handleAddWeight = () => {
    const num = Number(weightInput);
    if (!num) return;

    addWeight(num);
    setWeightInput("");
  };

  const chartData = sorted.map(w => ({
    date: new Date(w.date).toLocaleDateString(),
    weight: w.weight
  }));

  /* ================= UI ================= */
  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Health & Habits</h1>

      {/* SUMMARY */}
      <div style={styles.summary}>
        <div>Habits: {completionRate}%</div>
        <div>Weight: {weightPercent}%</div>
        <div>XP: {totalXP}</div>
      </div>

      {/* AI */}
      <div style={styles.ai}>{aiInsight}</div>

      {/* HABITS */}
      <div style={styles.card}>
        <h3>Habits</h3>

        <input
          style={styles.input}
          placeholder="Add habit"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button style={styles.button} onClick={addHabit}>Add</button>

        {habits.map(h => (
          <div key={h.id} style={styles.item}>
            {h.name}
            <button style={styles.button} onClick={() => toggleHabit(h.id)}>
              Done
            </button>
          </div>
        ))}
      </div>

      {/* WEIGHT */}
      <div style={styles.card}>
        <h3>Weight Tracker</h3>

        <input
          style={styles.input}
          type="number"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
        />

        <button style={styles.button} onClick={handleAddWeight}>Add</button>

        <p>Progress: {weightPercent}%</p>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={theme.colors.border} />
              <XAxis stroke={theme.colors.textMuted} dataKey="date" />
              <YAxis stroke={theme.colors.textMuted} />
              <Tooltip />
              <Line dataKey="weight" stroke={theme.colors.chartSecondary} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* HABIT IMPACT */}
      {habitImpact && (
        <div style={styles.card}>
          <h3>Habit Impact</h3>
          <p style={{ color: theme.colors.textMuted }}>{habitImpact}</p>
        </div>
      )}

    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: { padding: 20 },

  title: { color: theme.colors.primary },

  summary: {
    display: "flex",
    gap: 20,
    marginBottom: 20,
    color: theme.colors.text
  },

  card: {
    ...theme.components.card,
    marginBottom: 20
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 10
  },

  ai: {
    background: theme.colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20
  },

  input: theme.components.input,

  button: theme.components.button.primary
};