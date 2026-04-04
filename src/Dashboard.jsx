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
  getUnifiedAI
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

  const daily = getDailyData(logs, tasks);
  const heatmap = getHeatmapData(daily);
  const streak = getStreak(heatmap);

  const goalData = parseSmartGoal(user?.goal);
  const consistency = 0.5;

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

  const unifiedAI = getUnifiedAI({
    habits,
    tasks,
    weightLogs,
    goal: goalData,
    streak,
    consistency
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
    setGoal(`${adaptive.suggestion}`);
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Welcome, {user?.name} 👋</h1>

        <motion.div
          whileHover={{ scale: 1.1 }}
          style={styles.profile}
          onClick={() => navigate("/profile")}
        >
          👤
        </motion.div>
      </div>

      {/* GRID */}
      <div style={styles.grid}>

        {/* WEIGHT */}
        {weightLogs.length > 0 && (
          <div style={styles.card}>
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

        {/* AI COACH */}
        <div style={styles.highlightCard}>
          <h3>🧠 AI Coach</h3>
          <p>{unifiedAI}</p>
        </div>

        {/* FORECAST */}
        <div style={styles.card}>
          <h3>📊 Forecast</h3>
          <p>{forecast}</p>
        </div>

        {/* ADAPTIVE */}
        {adaptive && (
          <div style={styles.card}>
            <h3>🎯 Adaptive Goal</h3>
            <p>{adaptive.message}</p>
            <p><b>{adaptive.suggestion}</b></p>

            {adaptive.change !== "same" && (
              <button style={styles.primaryBtn} onClick={applyGoal}>
                Apply Goal
              </button>
            )}
          </div>
        )}

        {/* SUGGESTIONS */}
        <div style={styles.card}>
          <h3>💡 Suggestions</h3>
          {suggestions.map((s, i) => (
            <p key={i}>• {s}</p>
          ))}
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: 30,
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    color: "#fff",
    fontFamily: "Poppins, sans-serif"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  profile: {
    background: "linear-gradient(135deg, #2e7d32, #66bb6a)",
    padding: 12,
    borderRadius: "50%",
    cursor: "pointer"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)"
  },

  highlightCard: {
    background: "linear-gradient(135deg, #2e7d32, #66bb6a)",
    padding: 20,
    borderRadius: 16,
    color: "#fff"
  },

  weightGrid: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10
  },

  progressBar: {
    height: 8,
    background: "#1e293b",
    borderRadius: 10,
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: "#22c55e"
  },

  primaryBtn: {
    marginTop: 10,
    padding: 10,
    border: "none",
    borderRadius: 10,
    background: "#22c55e",
    color: "#fff",
    cursor: "pointer"
  }
};