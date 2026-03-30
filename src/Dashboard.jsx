import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  parseSmartGoal,
  getDailyData,
  getHeatmapData,
  getStreak
} from "./utils";

import {
  getHabitSuggestions,
  predictPerformance,
  getAdaptiveGoal,
  getUnifiedAI // 🔥 NEW
} from "./ai";

export default function Dashboard({
  items = [],
  logs = {},
  tasks = [],
  user,
  setGoal,
  weightLogs = [],
  weightGoal = null
}) {
  const navigate = useNavigate();

  const habits = items.filter(i => i?.type === "habit");

  // ================= DATA =================
  const daily = getDailyData(logs, tasks);
  const heatmap = getHeatmapData(daily);
  const streak = getStreak(heatmap);

  const goalData = parseSmartGoal(user?.goal);
  const consistency = 0.5;

  // ================= WEIGHT =================
  const sorted = [...weightLogs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const startWeight = sorted[0]?.weight || 0;
  const currentWeight = sorted[sorted.length - 1]?.weight || 0;
  const targetWeight = weightGoal || 0;

  const totalDiff = startWeight - targetWeight;
  const currentDiff = startWeight - currentWeight;

  const weightPercent =
    totalDiff > 0
      ? Math.min(Math.round((currentDiff / totalDiff) * 100), 100)
      : 0;

  // ================= 🧠 UNIFIED AI =================
  const unifiedAI = getUnifiedAI({
    habits,
    tasks,
    weightLogs,
    goal: goalData,
    streak,
    consistency
  });

  // ================= OTHER AI =================
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

      {/* 🏋️ WEIGHT CARD */}
      {weightLogs.length > 0 && (
        <div
          style={styles.weightCard}
          onClick={() => navigate("/weight")}
        >
          <h3>🏋️ Weight Progress</h3>

          <div style={styles.weightGrid}>
            <div>
              <p>Start</p>
              <h4>{startWeight}</h4>
            </div>

            <div>
              <p>Current</p>
              <h4>{currentWeight}</h4>
            </div>

            <div>
              <p>Target</p>
              <h4>{targetWeight || "-"}</h4>
            </div>
          </div>

          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${weightPercent}%`
              }}
            />
          </div>

          <p>{weightPercent}% completed</p>
        </div>
      )}

      {/* 🧠 UNIFIED AI COACH */}
      <div style={styles.aiCard}>
        <h3>🧠 AI Coach</h3>
        <p>{unifiedAI}</p>
      </div>

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

  weightCard: {
    background: "#1f2937",
    padding: 16,
    borderRadius: 12,
    cursor: "pointer"
  },

  weightGrid: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10
  },

  progressBar: {
    height: 8,
    background: "#374151",
    borderRadius: 10,
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: "#22c55e"
  },

  aiCard: {
    padding: 16,
    borderRadius: 12,
    background: "#0ea5e9", // 🔥 upgraded highlight
    color: "#fff"
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