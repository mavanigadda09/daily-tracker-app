import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useNotification } from "./context/NotificationContext.jsx";
import { motion } from "framer-motion";

import {
  getConsistencyScore,
  getDailyData,
  getHeatmapData,
  getStreak
} from "./ai/utils.js";

export default function Dashboard({
  logs = {},
  weightLogs = [],
  user,
  items = [],
  tasks = []
}) {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (user?.name) {
      showNotification(`Welcome back, ${user.name} 🚀`, "success");
    }
  }, [user?.name]);

  const { streak, consistency, message } = useMemo(() => {
    const daily = getDailyData(logs, tasks);
    const heatmap = getHeatmapData(daily);

    const streak = getStreak(heatmap);
    const consistency = getConsistencyScore(heatmap);

    let message = "Keep going 💪";

    if (streak === 0) message = "Start today 🚀";
    else if (streak < 3) message = "Stay consistent 👍";
    else if (streak < 7) message = "Nice progress 🔥";
    else message = "You're on fire 🚀";

    return { streak, consistency, message };
  }, [logs, tasks]);

  const weightData = useMemo(() => {
    if (!Array.isArray(weightLogs)) return [];

    return weightLogs.map((w) => ({
      date: new Date(w.date).toLocaleDateString(),
      weight: Number(w.weight || 0)
    }));
  }, [weightLogs]);

  return (
    <motion.div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1>Welcome back, {user?.name || "User"} 👋</h1>
          <p>🔥 {streak} day streak</p>
          <p>Consistency: {consistency}%</p>
        </div>

        <div
          style={styles.profile}
          onClick={() => navigate("/profile")}
        >
          👤
        </div>
      </div>

      {/* STATS */}
      <div style={styles.stats}>
        {["Steps", "Calories", "Active Time"].map((item, i) => (
          <div key={item} style={styles.card}>
            <span>{["🚶", "🔥", "⏱"][i]}</span>
            <h3>{item}</h3>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        {/* WEIGHT */}
        {weightData.length > 0 && (
          <div style={styles.card}>
            <h3>🏋️ Weight Progress</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="weight" stroke="#4ade80" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI */}
        <div style={styles.card}>
          <h3>🤖 AI Coach</h3>
          <p>{message}</p>

          <button onClick={() => navigate("/chat")}>
            Open Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ✅ FIXED STYLES
const styles = {
  container: {
    padding: 20,
    color: "white"
  },
  header: {
    display: "flex",
    justifyContent: "space-between"
  },
  profile: {
    cursor: "pointer"
  },
  stats: {
    display: "flex",
    gap: 10,
    marginTop: 20
  },
  grid: {
    marginTop: 20
  },
  card: {
    padding: 16,
    background: "#111",
    borderRadius: 10
  }
};