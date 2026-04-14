import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useNotification } from "./context/NotificationContext.jsx";
import { motion } from "framer-motion";

import { theme } from "./theme";

import {
  getConsistencyScore,
  getDailyData,
  getHeatmapData,
  getStreak
} from "./ai/utils.js";

/* ===== UTIL ===== */
const formatTime = (sec = 0) => {
  const m = Math.floor(sec / 60);
  return m ? `${m}m` : `${sec}s`;
};

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

  /* ================= CORE ================= */
  const daily = getDailyData(logs, tasks);
  const heatmap = getHeatmapData(daily);

  const streak = getStreak(heatmap);
  const consistency = getConsistencyScore(heatmap);

  /* ================= TASKS ================= */
  const activeTask = tasks.find(t => t.status === "running");

  const totalTime = tasks.reduce(
    (sum, t) => sum + (t.totalDuration || 0),
    0
  );

  const completedTasks = tasks.filter(t => t.completed).length;

  /* ================= HABITS ================= */
  const habits = items.filter(i => i.type === "habit");
  const activities = items.filter(i => i.type === "activity");

  const todayKey = new Date().toDateString();

  const completedHabits = habits.filter(
    h => h.completed?.[todayKey]?.done
  ).length;

  /* ================= PRODUCTIVITY ================= */
  const productivity = Math.min(
    100,
    Math.round(
      (completedTasks / (tasks.length || 1)) * 40 +
      (completedHabits / (habits.length || 1)) * 40 +
      consistency * 20
    )
  );

  /* ================= INSIGHTS ================= */
  const totalStats = useMemo(() => {
    let total = 0;
    let completed = 0;

    habits.forEach(h => {
      Object.values(h.completed || {}).forEach(v => {
        total++;
        if (v?.done) completed++;
      });
    });

    return {
      percent: total ? Math.round((completed / total) * 100) : 0
    };
  }, [habits]);

  const activityStats = useMemo(() => {
    let totalValue = 0;
    let totalTarget = 0;

    activities.forEach(a => {
      totalValue += a.value || 0;
      totalTarget += a.target || 0;
    });

    return {
      percent: totalTarget
        ? Math.min(Math.round((totalValue / totalTarget) * 100), 100)
        : 0
    };
  }, [activities]);

  /* ================= AI ================= */
  let message = "Keep going 💪";

  if (productivity < 20) message = "Start small today 🚀";
  else if (streak >= 5) message = "🔥 Strong streak!";
  else if (activityStats.percent < 50) message = "Increase activity 📈";
  else message = "You're doing great 🚀";

  /* ================= CHART ================= */
  const chartData = Object.keys(daily).slice(-7).map(date => ({
    date: new Date(date).toLocaleDateString(),
    value: daily[date]
  }));

  const weightData = useMemo(() => {
    if (!Array.isArray(weightLogs)) return [];
    return weightLogs.map(w => ({
      date: new Date(w.date).toLocaleDateString(),
      weight: Number(w.weight || 0)
    }));
  }, [weightLogs]);

  return (
    <motion.div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Welcome back, {user?.name || "User"} 👋
          </h1>

          <div style={styles.badges}>
            <span style={styles.badge}>🔥 {streak}</span>
            <span style={styles.badge}>⚡ {consistency}%</span>
            <span style={styles.badge}>📊 {productivity}%</span>
          </div>
        </div>

        <div style={styles.profile} onClick={() => navigate("/profile")}>
          👤
        </div>
      </div>

      {/* ACTIVE TASK */}
      {activeTask && (
        <div style={styles.active}>
          🎯 Focus Mode: {activeTask.name}
        </div>
      )}

      {/* STATS */}
      <div style={styles.stats}>
        <Stat label="Tasks Done" value={completedTasks} />
        <Stat label="Habits Done" value={completedHabits} />
        <Stat label="Focus Time" value={formatTime(totalTime)} />
      </div>

      {/* GRID */}
      <div style={styles.grid}>

        <Card title="📋 Tasks">
          {tasks.slice(0, 3).map(t => (
            <p key={t.id}>{t.name}</p>
          ))}
          <button style={styles.button} onClick={() => navigate("/tasks")}>
            Open →
          </button>
        </Card>

        <Card title="🔥 Habits">
          {habits.slice(0, 3).map(h => (
            <p key={h.id}>{h.name}</p>
          ))}
          <button style={styles.button} onClick={() => navigate("/habits")}>
            Open →
          </button>
        </Card>

        <Card title="📊 Habits">
          <Circle value={totalStats.percent} />
        </Card>

        <Card title="📈 Activities">
          <Circle value={activityStats.percent} />
        </Card>

      </div>

      {/* CHART */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📈 Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <XAxis stroke={theme.colors.textMuted} dataKey="date" />
            <YAxis stroke={theme.colors.textMuted} />
            <CartesianGrid stroke={theme.colors.border} />
            <Tooltip />
            <Line dataKey="value" stroke={theme.colors.chartPrimary} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* WEIGHT */}
      {weightData.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏋️ Weight</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <XAxis stroke={theme.colors.textMuted} dataKey="date" />
              <YAxis stroke={theme.colors.textMuted} />
              <CartesianGrid stroke={theme.colors.border} />
              <Tooltip />
              <Line dataKey="weight" stroke={theme.colors.chartSecondary} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🤖 AI Coach</h3>
        <p style={{ color: theme.colors.textMuted }}>{message}</p>
      </div>

    </motion.div>
  );
}

/* ===== COMPONENTS ===== */
const Stat = ({ label, value }) => (
  <div style={styles.statCard}>
    <h3>{value}</h3>
    <p style={{ color: theme.colors.textMuted }}>{label}</p>
  </div>
);

const Card = ({ title, children }) => (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>{title}</h3>
    {children}
  </div>
);

const Circle = ({ value }) => (
  <div style={styles.circle}>
    {value}%
  </div>
);

/* ===== STYLES ===== */
const styles = {
  container: { padding: 24 },

  header: { display: "flex", justifyContent: "space-between" },

  title: { color: theme.colors.text },

  profile: { cursor: "pointer" },

  badges: { display: "flex", gap: 10 },

  badge: {
    background: theme.colors.surface,
    padding: "6px 10px",
    borderRadius: 10,
    border: `1px solid ${theme.colors.border}`
  },

  active: {
    marginTop: 15,
    padding: 12,
    background: theme.colors.surface,
    borderRadius: 10
  },

  stats: { display: "flex", gap: 16, marginTop: 20 },

  statCard: {
    flex: 1,
    padding: 16,
    background: theme.colors.surface,
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20,
    marginTop: 20
  },

  card: {
    padding: 20,
    background: theme.colors.surface,
    borderRadius: 16,
    border: `1px solid ${theme.colors.border}`
  },

  cardTitle: {
    color: theme.colors.primary
  },

  circle: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "auto",
    border: `8px solid ${theme.colors.primary}`
  },

  button: {
    ...theme.components.button.primary,
    marginTop: 10
  }
};