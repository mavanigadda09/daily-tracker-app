import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

import {
  parseSmartGoal,
  calculatePercent,
  getDailyData,
  getHeatmapData,
  getStreak,
  compareVersions
} from "./utils";

import {
  getAIInsight,
  getHabitSuggestions,
  explainDiff,
  predictPerformance,
  getAdaptiveGoal // 🔥 NEW
} from "./ai";

export default function Dashboard({
  items = [],
  logs = {},
  tasks = [],
  user,
  onUndo,
  history = [],
  onRestoreVersion,
  setGoal // 🔥 NEW
}) {
  const navigate = useNavigate();

  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);

  const diff =
    selectedA && selectedB
      ? compareVersions(selectedA.data, selectedB.data)
      : [];

  const explanation =
    selectedA && selectedB
      ? explainDiff(diff, selectedA.data, selectedB.data)
      : "";

  const habits = items.filter(i => i?.type === "habit");
  const activities = items.filter(i => i?.type === "activity");

  // ================= DATA =================
  const daily = getDailyData(logs, tasks);
  const heatmap = getHeatmapData(daily);
  const streak = getStreak(heatmap);

  const goalData = parseSmartGoal(user?.goal);
  const consistency = 0.5; // safe fallback

  // ================= AI =================
  const insight = getAIInsight({
    goalPercent: 0,
    trend: 0,
    consistency,
    todayValue: 0,
    streak,
    heatmap,
    habits
  });

  const suggestions = getHabitSuggestions(items);

  const forecast = predictPerformance({
    daily,
    goal: goalData,
    streak,
    consistency
  });

  // 🔥 ADAPTIVE GOAL
  const adaptive = getAdaptiveGoal({
    daily,
    goal: goalData,
    streak,
    consistency
  });

  const applyGoal = () => {
    if (!adaptive || !adaptive.suggestion) return;

    const unit = goalData?.unit || "units";

    const newGoalText =
      unit === "minutes"
        ? `${Math.round(adaptive.suggestion / 60)} hours`
        : `${adaptive.suggestion} ${unit}`;

    setGoal(newGoalText);
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Welcome, {user?.name} 👋</h1>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onUndo}
          style={styles.undoBtn}
        >
          ⬅ Undo
        </motion.button>
      </div>

      {/* AI COACH */}
      <div style={styles.aiCard}>{insight}</div>

      {/* FORECAST */}
      <div style={styles.forecastCard}>{forecast}</div>

      {/* 🔥 ADAPTIVE GOAL */}
      {adaptive && (
        <div style={styles.adaptiveCard}>
          <h3>Adaptive Goal Suggestion</h3>

          <p style={styles.adaptiveText}>
            {adaptive.message}
          </p>

          <p style={styles.adaptiveValue}>
            Suggested: {adaptive.suggestion}
          </p>

          {adaptive.change !== "same" && (
            <button style={styles.applyBtn} onClick={applyGoal}>
              Apply Goal
            </button>
          )}
        </div>
      )}

      {/* SUGGESTIONS */}
      <div style={styles.card}>
        <h3>AI Suggestions</h3>
        {suggestions.map((s, i) => (
          <p key={i}>• {s}</p>
        ))}
      </div>

      {/* VERSION HISTORY */}
      <div style={styles.card}>
        <h3>Version History</h3>
        {history.map((h, i) => (
          <div key={i} onClick={() => onRestoreVersion(h)}>
            {new Date(h.timestamp).toLocaleString()}
          </div>
        ))}
      </div>

      {/* DIFF */}
      <div style={styles.card}>
        <h3>Compare Versions</h3>

        <select onChange={(e) => setSelectedA(history[e.target.value])}>
          <option>Select A</option>
          {history.map((h, i) => (
            <option key={i} value={i}>
              {new Date(h.timestamp).toLocaleString()}
            </option>
          ))}
        </select>

        <select onChange={(e) => setSelectedB(history[e.target.value])}>
          <option>Select B</option>
          {history.map((h, i) => (
            <option key={i} value={i}>
              {new Date(h.timestamp).toLocaleString()}
            </option>
          ))}
        </select>

        {diff.map((d, i) => (
          <p key={i}>{d}</p>
        ))}

        {explanation && <p>{explanation}</p>}
      </div>

    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: { padding: 20, color: "#fff" },

  header: {
    display: "flex",
    justifyContent: "space-between"
  },

  undoBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: 10,
    borderRadius: 8
  },

  aiCard: {
    padding: 15,
    background: "#1f2937",
    borderRadius: 10
  },

  forecastCard: {
    padding: 15,
    background: "#0284c7",
    borderRadius: 10,
    marginTop: 10
  },

  adaptiveCard: {
    padding: 15,
    background: "#065f46",
    borderRadius: 12,
    marginTop: 10
  },

  adaptiveText: {
    marginBottom: 8
  },

  adaptiveValue: {
    fontWeight: "bold",
    marginBottom: 10
  },

  applyBtn: {
    background: "#22c55e",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  card: {
    padding: 15,
    background: "#1f2937",
    borderRadius: 10,
    marginTop: 10
  }
};