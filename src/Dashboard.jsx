import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useNotification } from "../context/NotificationContext";
import { motion } from "framer-motion";

// 🧠 AI ENGINE
import {
  getHabitStreak,
  getConsistencyScore,
  getMotivationMessage,
  getDailyData,
  getHeatmapData
} from "../utils/utils";

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
    showNotification(`Welcome back, ${user?.name || "User"} 🚀`, "success");
  }, []);

  // ===== AI ENGINE =====
  const daily = getDailyData(logs, tasks);
  const heatmap = getHeatmapData(daily);

  const streak = getHabitStreak(items);
  const consistency = getConsistencyScore(heatmap);
  const message = getMotivationMessage({ streak, consistency });

  // ===== MOCK DATA =====
  const fitnessData = [
    { day: "Mon", steps: 4000 },
    { day: "Tue", steps: 6500 },
    { day: "Wed", steps: 8000 },
    { day: "Thu", steps: 7200 },
    { day: "Fri", steps: 9000 },
    { day: "Sat", steps: 11000 },
    { day: "Sun", steps: 7000 }
  ];

  const weightData = weightLogs.map(w => ({
    date: new Date(w.date).toLocaleDateString(),
    weight: w.weight
  }));

  const handleStatClick = (type) => {
    showNotification(`${type} insights coming soon 🚀`, "info");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={styles.container}
    >

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Welcome back, {user?.name} 👋
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
            whileTap={{ scale: 0.97 }}
            style={styles.statCard}
            onClick={() => handleStatClick(item)}
          >
            <span>{["🚶","🔥","⏱"][i]}</span>
            <h3>{item}</h3>
            <p>{i === 0 ? "8,245" : i === 1 ? "1,230 kcal" : "75 min"}</p>
          </motion.div>
        ))}
      </div>

      {/* GRID */}
      <div style={styles.grid}>

        {/* STEPS */}
        <motion.div whileHover={{ y: -6 }} style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Weekly Steps</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fitnessData}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="steps" stroke="#22c55e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* WEIGHT */}
        {weightData.length > 0 && (
          <motion.div whileHover={{ y: -6 }} style={styles.card}>
            <h3 style={styles.cardTitle}>🏋️ Weight Progress</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#4ade80" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* 🤖 AI CHAT COACH */}
        <motion.div style={styles.aiCard}>

          <h3>🤖 AI Coach</h3>

          {/* CHAT */}
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
              onClick={() => navigate("/activities")}
            >
              🏃 Start Activity
            </button>

            <button
              style={styles.actionBtn}
              onClick={() => navigate("/habits")}
            >
              ✅ Complete Habit
            </button>

            <button
              style={styles.actionBtn}
              onClick={() => navigate("/tasks")}
            >
              📌 Add Task
            </button>

          </div>

        </motion.div>

      </div>

    </motion.div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "20px",
    background: "var(--bg)",
    color: "var(--text)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 30
  },

  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 600
  },

  subtitle: {
    fontSize: 14,
    color: "var(--text-muted)"
  },

  profile: {
    background: "var(--accent)",
    padding: 10,
    borderRadius: "50%",
    cursor: "pointer"
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
    marginBottom: 30
  },

  statCard: {
    background: "var(--card)",
    padding: 18,
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20
  },

  card: {
    background: "var(--card)",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
  },

  cardTitle: {
    marginBottom: 10
  },

  aiCard: {
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    padding: 20,
    borderRadius: 16,
    border: "1px solid var(--border)",
    color: "#fff"
  },

  chatBox: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 12
  },

  botMsg: {
    background: "rgba(255,255,255,0.08)",
    padding: 10,
    borderRadius: 10,
    fontSize: 14
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  actionBtn: {
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500
  }
};