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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.container}
    >
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Welcome back, {user?.name || "User"} 👋
          </h1>

          <div style={styles.badges}>
            <span style={styles.badge}>🔥 {streak} day streak</span>
            <span style={styles.badge}>⚡ {consistency}% consistency</span>
          </div>
        </div>

        <div style={styles.profile} onClick={() => navigate("/profile")}>
          👤
        </div>
      </div>

      {/* STATS */}
      <div style={styles.stats}>
        {[
          { label: "Steps", icon: "🚶" },
          { label: "Calories", icon: "🔥" },
          { label: "Active Time", icon: "⏱" }
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ scale: 1.05 }}
            style={styles.statCard}
          >
            <span style={styles.statIcon}>{item.icon}</span>
            <h3>{item.label}</h3>
          </motion.div>
        ))}
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        {/* WEIGHT CHART */}
        {weightData.length > 0 && (
          <motion.div whileHover={{ scale: 1.01 }} style={styles.card}>
            <h3 style={styles.cardTitle}>🏋️ Weight Progress</h3>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#facc15"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* AI COACH */}
        <motion.div whileHover={{ scale: 1.01 }} style={styles.card}>
          <h3 style={styles.cardTitle}>🤖 AI Coach</h3>

          <p style={styles.message}>{message}</p>

          <button
            onClick={() => navigate("/chat")}
            style={styles.primaryBtn}
          >
            Open Chat
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ===== STYLES (PHOENIX THEME) =====
const styles = {
  container: {
    padding: 24,
    color: "#fff"
  },

  title: {
    color: "#facc15",
    textShadow: "0 0 10px #facc15"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  profile: {
    cursor: "pointer",
    fontSize: 22
  },

  badges: {
    display: "flex",
    gap: 10,
    marginTop: 8
  },

  badge: {
    background: "rgba(250,204,21,0.15)",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    color: "#facc15"
  },

  stats: {
    display: "flex",
    gap: 16,
    marginTop: 24,
    flexWrap: "wrap"
  },

  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 16,
    background: "#020617",
    boxShadow: "0 0 15px rgba(250,204,21,0.2)",
    textAlign: "center"
  },

  statIcon: {
    fontSize: 24
  },

  grid: {
    marginTop: 30,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20
  },

  card: {
    padding: 20,
    borderRadius: 18,
    background: "#020617",
    boxShadow: "0 0 20px rgba(250,204,21,0.15)"
  },

  cardTitle: {
    marginBottom: 10,
    color: "#facc15"
  },

  message: {
    marginBottom: 12,
    opacity: 0.9
  },

  primaryBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#facc15,#f97316)",
    color: "#000",
    cursor: "pointer",
    fontWeight: "bold"
  }
};