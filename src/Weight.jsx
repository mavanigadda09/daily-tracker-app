import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

// 🔥 AI IMPORTS
import {
  detectPlateau,
  predictWeight,
  getWeightAdvice,
  analyzeWeightWithHabits
} from "./ai";

export default function Weight({
  weightLogs = [],
  addWeight,
  deleteWeight,
  weightGoal,
  setWeightGoal,
  items = [] // 🔥 NEW (for habit connection)
}) {
  const [value, setValue] = useState("");
  const [goalInput, setGoalInput] = useState("");

  const sorted = [...weightLogs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const start = sorted[0]?.weight || 0;
  const current = sorted[sorted.length - 1]?.weight || 0;
  const target = weightGoal || 0;

  // ================= PROGRESS =================
  const totalDiff = start - target;
  const currentDiff = start - current;

  const percent =
    totalDiff > 0
      ? Math.min(Math.round((currentDiff / totalDiff) * 100), 100)
      : 0;

  // ================= BASIC AI =================
  let insight = "";

  if (!target) {
    insight = "🎯 Set a goal to start tracking progress.";
  } else if (percent >= 90) {
    insight = "🔥 You're very close to your goal!";
  } else if (percent >= 50) {
    insight = "📈 Good progress. Stay consistent.";
  } else if (percent > 0) {
    insight = "⚡ You're getting started. Keep going.";
  } else {
    insight = "⚠️ No progress yet. Start today.";
  }

  // ================= 🔥 ADVANCED AI =================
  const plateau = detectPlateau(sorted);
  const prediction = predictWeight(sorted);
  const advice = getWeightAdvice(sorted, target);

  // ================= 🔥 HABIT CONNECTION =================
  const habits = items.filter(i => i.type === "habit");

  const habitInsight = analyzeWeightWithHabits({
    weightLogs: sorted,
    habits
  });

  // ================= CHART =================
  const chartData = sorted.map((w) => ({
    date: new Date(w.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    }),
    weight: w.weight
  }));

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🏋️ Weight Tracker</h1>

      {/* ADD WEIGHT */}
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
          onClick={() => {
            addWeight(Number(value));
            setValue("");
          }}
        >
          Add
        </button>
      </div>

      {/* GOAL */}
      <div style={styles.card}>
        <input
          type="number"
          placeholder="Set target weight"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={() => {
            setWeightGoal(Number(goalInput));
            setGoalInput("");
          }}
        >
          Save Goal
        </button>
      </div>

      {/* STATS */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <p>Start</p>
          <h3>{start || "-"}</h3>
        </div>

        <div style={styles.statCard}>
          <p>Current</p>
          <h3>{current || "-"}</h3>
        </div>

        <div style={styles.statCard}>
          <p>Target</p>
          <h3>{target || "-"}</h3>
        </div>
      </div>

      {/* PROGRESS */}
      <div style={styles.card}>
        <h3>Progress</h3>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percent}%`
            }}
          />
        </div>

        <p>{percent}% completed</p>
      </div>

      {/* BASIC AI */}
      <div style={styles.aiCard}>
        {insight}
      </div>

      {/* 🔥 ADVANCED AI */}
      <div style={styles.card}>
        <h3>AI Analysis</h3>

        {plateau && <p>{plateau}</p>}
        {prediction && <p>{prediction}</p>}
        {advice && <p>{advice}</p>}
      </div>

      {/* 🔥 HABIT IMPACT */}
      {habitInsight && (
        <div style={styles.card}>
          <h3>Habit Impact</h3>
          <p>{habitInsight}</p>
        </div>
      )}

      {/* CHART */}
      <div style={styles.card}>
        <h3>Progress Chart</h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line dataKey="weight" stroke="#6366f1" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* HISTORY */}
      <div style={styles.card}>
        <h3>History</h3>

        {sorted.map((w, i) => (
          <div key={i} style={styles.row}>
            <span>{new Date(w.date).toLocaleDateString()}</span>
            <span>{w.weight} kg</span>
            <button onClick={() => deleteWeight(w.date)}>
              ✕
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: { padding: 24, display: "flex", flexDirection: "column", gap: 16 },

  title: { fontSize: 24 },

  card: { background: "#1f2937", padding: 16, borderRadius: 12 },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#020617",
    color: "#fff",
    marginRight: 10
  },

  button: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#6366f1",
    color: "#fff"
  },

  stats: { display: "flex", gap: 10 },

  statCard: {
    flex: 1,
    background: "#1f2937",
    padding: 16,
    borderRadius: 12,
    textAlign: "center"
  },

  progressBar: {
    height: 10,
    background: "#374151",
    borderRadius: 10,
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: "#22c55e"
  },

  aiCard: {
    background: "#0ea5e9",
    padding: 16,
    borderRadius: 12
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #374151"
  }
};