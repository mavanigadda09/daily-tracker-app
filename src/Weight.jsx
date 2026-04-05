import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import {
  detectPlateau,
  predictWeight,
  getWeightAdvice,
  analyzeWeightWithHabits
} from "./ai/ai";

export default function Weight({
  weightLogs = [],
  addWeight,
  deleteWeight,
  weightGoal,
  setWeightGoal,
  items = []
}) {

  const [value, setValue] = useState("");
  const [goalInput, setGoalInput] = useState("");

  // ===== SORTED =====
  const sorted = useMemo(() => {
    return [...weightLogs].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [weightLogs]);

  const start = sorted[0]?.weight || 0;
  const current = sorted[sorted.length - 1]?.weight || 0;
  const target = weightGoal || 0;

  // ===== PROGRESS =====
  const percent = useMemo(() => {
    const totalDiff = start - target;
    const currentDiff = start - current;

    return totalDiff > 0
      ? Math.min(Math.round((currentDiff / totalDiff) * 100), 100)
      : 0;
  }, [start, current, target]);

  // ===== BASIC AI =====
  const insight = useMemo(() => {
    if (!target) return "🎯 Set a goal to start tracking progress.";
    if (percent >= 90) return "🔥 You're very close!";
    if (percent >= 50) return "📈 Good progress!";
    if (percent > 0) return "⚡ Keep going!";
    return "⚠️ Start today.";
  }, [percent, target]);

  // ===== ADVANCED AI (SAFE) =====
  const { plateau, prediction, advice } = useMemo(() => {
    if (sorted.length < 3) return {};

    return {
      plateau: detectPlateau(sorted),
      prediction: predictWeight(sorted),
      advice: getWeightAdvice(sorted, target)
    };
  }, [sorted, target]);

  // ===== HABIT LINK =====
  const habitInsight = useMemo(() => {
    if (sorted.length < 3) return "";

    const habits = items.filter(i => i.type === "habit");

    return analyzeWeightWithHabits({
      weightLogs: sorted,
      habits
    });
  }, [sorted, items]);

  // ===== CHART =====
  const chartData = useMemo(() => {
    return sorted.map((w) => ({
      date: new Date(w.date).toLocaleDateString(),
      weight: w.weight
    }));
  }, [sorted]);

  // ===== ADD =====
  const handleAdd = () => {
    const num = Number(value);
    if (!num || num <= 0) return;

    addWeight(num);
    setValue("");
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🏋️ Weight Tracker</h1>

      {/* ADD */}
      <div style={styles.card}>
        <input
          type="number"
          placeholder="Enter weight"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={handleAdd}
          disabled={!value}
        >
          Add
        </button>
      </div>

      {/* GOAL */}
      <div style={styles.card}>
        <input
          type="number"
          placeholder="Set target"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={() => {
            if (!goalInput) return;
            setWeightGoal(Number(goalInput));
            setGoalInput("");
          }}
        >
          Save Goal
        </button>
      </div>

      {/* EMPTY STATE */}
      {sorted.length === 0 && (
        <p style={styles.empty}>
          No data yet. Add your first weight 🚀
        </p>
      )}

      {/* STATS */}
      <div style={styles.stats}>
        <Stat label="Start" value={start} />
        <Stat label="Current" value={current} />
        <Stat label="Target" value={target} />
      </div>

      {/* PROGRESS */}
      <div style={styles.card}>
        <h3>Progress</h3>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${percent}%` }} />
        </div>
        <p>{percent}%</p>
      </div>

      {/* AI */}
      <div style={styles.aiCard}>{insight}</div>

      {/* ADVANCED AI */}
      {(plateau || prediction || advice) && (
        <div style={styles.card}>
          <h3>AI Analysis</h3>
          {plateau && <p>{plateau}</p>}
          {prediction && <p>{prediction}</p>}
          {advice && <p>{advice}</p>}
        </div>
      )}

      {/* HABITS */}
      {habitInsight && (
        <div style={styles.card}>
          <h3>Habit Impact</h3>
          <p>{habitInsight}</p>
        </div>
      )}

      {/* CHART */}
      {chartData.length > 0 && (
        <div style={styles.card}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="weight" stroke="#6366f1" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}

// ===== SMALL COMPONENT =====
function Stat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <p>{label}</p>
      <h3>{value || "-"}</h3>
    </div>
  );
}