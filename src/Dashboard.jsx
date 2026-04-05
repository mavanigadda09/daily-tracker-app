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

// ✅ FIXED IMPORT (correct path)
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

  // ===== WELCOME NOTIFICATION =====
  useEffect(() => {
    if (user?.name) {
      showNotification(`Welcome back, ${user.name} 🚀`, "success");
    }
  }, [user?.name]);

  // ===== AI ENGINE =====
  const { streak, consistency, message } = useMemo(() => {
    const daily = getDailyData(logs, tasks);
    const heatmap = getHeatmapData(daily);

    const streak = getStreak(heatmap);
    const consistency = getConsistencyScore(heatmap);

    // ✅ SAFE MESSAGE GENERATOR (replacing missing function)
    let message = "Keep going 💪";

    if (streak === 0) {
      message = "Start today — small steps matter 🚀";
    } else if (streak < 3) {
      message = "You're getting started — stay consistent 👍";
    } else if (streak < 7) {
      message = "Nice progress! Keep pushing 🔥";
    } else {
      message = "You're on fire! Amazing consistency 🚀";
    }

    return { streak, consistency, message };
  }, [logs, tasks, items]);

  // ===== WEIGHT DATA =====
  const weightData = useMemo(() => {
    if (!Array.isArray(weightLogs)) return [];

    return weightLogs.map((w) => ({
      date: new Date(w.date).toLocaleDateString(),
      weight: Number(w.weight || 0)
    }));
  }, [weightLogs]);

  const handleStatClick = (type) => {
    showNotification(`${type} insights coming soon 🚀`, "info");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={styles.container}
    >
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Welcome back, {user?.name || "User"} 👋
          </h1>

          <p style={{ color: "var(--accent)", marginTop: 6 }}>
            🔥 {streak} day streak
          </p>

          <p style={styles.subtitle}>
            Consistency: {consistency}%
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={styles.profile}
          onClick={() => navigate("/profile")}
        >
          👤
        </motion.div>
      </div>

      {/* STATS */}
      <div style={styles.stats}>
        {["Steps", "Calories", "Active Time"].map((item, i) => (
          <motion.div
            key={item}
            whileHover={{ scale: 1.05 }}
            style={styles.statCard}
            onClick={() => handleStatClick(item)}
          >
            <span>{["🚶", "🔥", "⏱"][i]}</span>
            <h3>{item}</h3>
            <p>Coming soon</p>
          </motion.div>
        ))}
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        {/* WEIGHT */}
        {weightData.length > 0 && (
          <motion.div whileHover={{ y: -6 }} style={styles.card}>
            <h3 style={styles.cardTitle}>🏋️ Weight Progress</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#4ade80"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* 🤖 AI COACH */}
        <motion.div style={styles.aiCard}>
          <h3>🤖 AI Coach</h3>

          <div style={styles.chatBox}>
            <p style={styles.botMsg}>{message}</p>

            {streak === 0 && (
              <p style={styles.botMsg}>
                💡 Start your first habit today!
              </p>
            )}

            {streak >= 3 && (
              <p style={styles.botMsg}>
                🔥 You're building strong momentum!
              </p>
            )}
          </div>

          {/* ACTIONS */}
          <div style={styles.actions}>
            <button
              style={styles.actionBtn}
              onClick={() => navigate("/chat")}
            >
              🤖 Open AI Chat
            </button>

            <button
              style={styles.actionBtn}
              onClick={() => navigate("/habits")}
            >
              ✅ Manage Habits
            </button>

            <button
              style={styles.actionBtn}
              onClick={() => navigate("/tasks")}
            >
              📌 Manage Tasks
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}