import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
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

/* ===== SAFE ===== */
const safeArray = (v) => (Array.isArray(v) ? v : []);

const formatTime = (sec = 0) => {
  const m = Math.floor(sec / 60);
  return m ? `${m}m` : `${sec}s`;
};

const getKey = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export default function Dashboard({
  logs = {},
  weightLogs = [],
  user,
  items = [],
  tasks = []
}) {

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  /* ================= SAFE DATA ================= */
  const safeTasks = safeArray(tasks);
  const safeItems = safeArray(items);
  const safeWeight = safeArray(weightLogs);

  useEffect(() => {
    if (user?.name) {
      showNotification(`Welcome back, ${user.name} 🚀`, "success");
    }
  }, [user?.name]);

  /* ================= CORE ================= */
  const daily = getDailyData(logs, safeTasks);
  const heatmap = getHeatmapData(daily);

  const streak = getStreak(heatmap);
  const consistency = getConsistencyScore(heatmap);

  /* ================= TASKS ================= */
  const activeTask = safeTasks.find(t => t.status === "running");

  const totalTime = safeTasks.reduce(
    (sum, t) => sum + (t.totalDuration || 0),
    0
  );

  const completedTasks = safeTasks.filter(t => t.completed).length;

  /* ================= HABITS ================= */
  const habits = safeItems.filter(i => i.type === "habit");
  const activities = safeItems.filter(i => i.type === "activity");

  const todayKey = getKey(new Date());

  const completedHabits = habits.filter(
    h => h.completed?.[todayKey]?.done
  ).length;

  /* ================= PRODUCTIVITY ================= */
  const productivity = Math.min(
    100,
    Math.round(
      (completedTasks / (safeTasks.length || 1)) * 40 +
      (completedHabits / (habits.length || 1)) * 40 +
      consistency * 20
    )
  );

  /* ================= INSIGHTS ================= */
  const habitsPercent = useMemo(() => {
    let total = 0;
    let done = 0;

    habits.forEach(h => {
      Object.values(h.completed || {}).forEach(v => {
        total++;
        if (v?.done) done++;
      });
    });

    return total ? Math.round((done / total) * 100) : 0;
  }, [habits]);

  const activityPercent = useMemo(() => {
    let val = 0;
    let target = 0;

    activities.forEach(a => {
      val += a.value || 0;
      target += a.target || 0;
    });

    return target
      ? Math.min(Math.round((val / target) * 100), 100)
      : 0;
  }, [activities]);

  /* ================= AI ================= */
  let message = "Keep going 💪";

  if (productivity < 20) message = "Start small today 🚀";
  else if (streak >= 7) message = "🔥 You're on fire!";
  else if (activityPercent < 50) message = "Increase activity 📈";
  else message = "Great consistency 🚀";

  /* ================= CHART ================= */
  const chartData = Object.keys(daily).slice(-7).map(date => ({
    date: new Date(date).toLocaleDateString(),
    value: daily[date]
  }));

  const weightData = safeWeight.map(w => ({
    date: new Date(w.date).toLocaleDateString(),
    weight: Number(w.weight || 0)
  }));

  /* ================= UI ================= */
  return (
    <motion.div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Welcome back, {user?.name || "User"} 👋
          </h1>

          <div style={styles.badges}>
            <Badge label="🔥" value={streak} />
            <Badge label="⚡" value={`${consistency}%`} />
            <Badge label="📊" value={`${productivity}%`} />
          </div>
        </div>

        <div style={styles.profile} onClick={() => navigate("/profile")}>
          👤
        </div>
      </div>

      {/* ACTIVE TASK */}
      {activeTask && (
        <motion.div style={styles.active} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
          🎯 Focus: <strong>{activeTask.name}</strong>
        </motion.div>
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
          {safeTasks.slice(0, 3).map(t => (
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

        <Card title="📊 Habit Score">
          <Circle value={habitsPercent} />
        </Card>

        <Card title="📈 Activity Score">
          <Circle value={activityPercent} />
        </Card>

      </div>

      {/* CHART */}
      <Card title="📈 Last 7 Days">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <XAxis stroke={theme.colors.textMuted} dataKey="date" />
            <YAxis stroke={theme.colors.textMuted} />
            <CartesianGrid stroke={theme.colors.border} />
            <Tooltip />
            <Line dataKey="value" stroke={theme.colors.primary} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* WEIGHT */}
      {weightData.length > 0 && (
        <Card title="🏋️ Weight Progress">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <XAxis stroke={theme.colors.textMuted} dataKey="date" />
              <YAxis stroke={theme.colors.textMuted} />
              <CartesianGrid stroke={theme.colors.border} />
              <Tooltip />
              <Line dataKey="weight" stroke={theme.colors.primary} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* AI */}
      <Card title="🤖 AI Coach">
        <p style={{ color: theme.colors.textMuted }}>{message}</p>
      </Card>

    </motion.div>
  );
}

/* ===== COMPONENTS ===== */
const Stat = ({ label, value }) => (
  <div style={styles.statCard}>
    <h2>{value}</h2>
    <p style={{ color: theme.colors.textMuted }}>{label}</p>
  </div>
);

const Badge = ({ label, value }) => (
  <span style={styles.badge}>
    {label} {value}
  </span>
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

  badges: { display: "flex", gap: 10, marginTop: 8 },

  badge: {
    background: theme.colors.surface,
    padding: "6px 10px",
    borderRadius: 10,
    border: `1px solid ${theme.colors.border}`
  },

  active: {
    marginTop: 15,
    padding: 14,
    borderRadius: 12,
    background: "linear-gradient(135deg,#22c55e33,#0f172a)"
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
    border: `1px solid ${theme.colors.border}`,
    marginTop: 20
  },

  cardTitle: { color: theme.colors.primary },

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