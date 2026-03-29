import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  parseSmartGoal,
  getDailyData,
  getHeatmapData,
  getStreak
} from "./utils";

import {
  getAIInsight,
  getHabitSuggestions,
  predictPerformance,
  getAdaptiveGoal
} from "./ai";

export default function Dashboard({
  items = [],
  logs = {},
  tasks = [],
  user,
  setGoal
}) {
  const navigate = useNavigate();

  const habits = items.filter(i => i?.type === "habit");

  // ================= DATA =================
  const daily = getDailyData(logs, tasks);
  const heatmap = getHeatmapData(daily);
  const streak = getStreak(heatmap);

  const goalData = parseSmartGoal(user?.goal);
  const consistency = 0.5;

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

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={styles.profile}
          onClick={() => navigate("/profile")}
        >
          👤
        </motion.div>
      </div>

      {/* AI COACH */}
      <div style={styles.aiCard}>{insight}</div>

      {/* FORECAST */}
      <div style={styles.forecastCard}>{forecast}</div>

      {/* ADAPTIVE GOAL */}
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

      {/* AI SUGGESTIONS */}
      <div style={styles.card}>
        <h3>AI Suggestions</h3>
        {suggestions.map((s, i) => (
          <p key={i}>• {s}</p>
        ))}
      </div>

    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  profile: {
    background: "#1f2937",
    padding: 10,
    borderRadius: "50%",
    cursor: "pointer"
  },

  aiCard: {
    padding: 16,
    borderRadius: 12,
    background: "#1f2937"
  },

  forecastCard: {
    padding: 16,
    borderRadius: 12,
    background: "#0284c7",
    color: "#fff"
  },

  adaptiveCard: {
    padding: 16,
    borderRadius: 12,
    background: "#065f46",
    color: "#fff"
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
    padding: "10px 14px",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  card: {
    padding: 16,
    borderRadius: 12,
    background: "#1f2937"
  }
};