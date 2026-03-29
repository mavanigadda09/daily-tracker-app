import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";

import { motion } from "framer-motion";

import {
  parseSmartGoal,
  calculatePercent,
  getDailyData,
  getWeeklyData,
  getHeatmapData,
  getStreak,
  getTaskBreakdown
} from "./utils";

export default function Analytics({ logs = {}, tasks = [], user }) {

  if ((!logs || typeof logs !== "object") && !tasks.length) {
    return <p style={styles.empty}>No data available</p>;
  }

  // ✅ CLEAN DATA PIPELINE
  const daily = getDailyData(logs, tasks);
  const chartData = Object.keys(daily).map(date => ({
    date,
    value: daily[date]
  }));

  if (!chartData.length) {
    return <p style={styles.empty}>No usable data</p>;
  }

  // ================= METRICS =================
  const values = chartData.map(d => d.value);

  const total = values.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / values.length);

  const best = chartData.reduce((max, d) =>
    d.value > max.value ? d : max,
    chartData[0]
  );

  const trend =
    values.length >= 2
      ? values.at(-1) - values.at(-2)
      : 0;

  const consistency =
    values.filter(v => v > 0).length / values.length;

  const score = Math.min(
    100,
    Math.round(avg * 0.5 + consistency * 50 + (trend > 0 ? 10 : 0))
  );

  const insight =
    score > 80
      ? "🔥 Excellent consistency!"
      : score > 50
      ? "📈 Good progress!"
      : "⚡ Stay consistent!";

  // ================= GOAL =================
  const goalData = parseSmartGoal(user?.goal);

  const todayKey = new Date().toDateString();
  const todayValue = daily[todayKey] || 0;

  const goalPercent = goalData
    ? calculatePercent(todayValue, goalData.target)
    : 0;

  // ================= REUSABLE LOGIC =================
  const last7Days = getWeeklyData(daily);
  const last30Days = getHeatmapData(daily);
  const streak = getStreak(last30Days);
  const taskData = getTaskBreakdown(tasks);

  const getColor = (v) =>
    v === 0 ? "#1f2937"
    : v < 30 ? "#4ade80"
    : v < 60 ? "#22c55e"
    : "#16a34a";

  return (
    <motion.div style={styles.container}>

      <h1 style={styles.title}>Analytics</h1>
      <p style={styles.subtitle}>Your performance insights</p>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <Card title="Total" value={total} />
        <Card title="Average" value={avg} />
        <Card title="Best Day" value={best.date} />
        <Card title="Score" value={score} />
      </div>

      <div style={styles.insight}>{insight}</div>

      {/* GOAL */}
      {goalData && (
        <div style={styles.card}>
          <h3>🎯 Goal Progress</h3>

          <div style={styles.progressBg}>
            <div style={{
              ...styles.progressFill,
              width: `${goalPercent}%`
            }} />
          </div>

          <p style={styles.subtitle}>
            {todayValue} / {goalData.target} {goalData.unit}
          </p>
        </div>
      )}

      {/* DAILY */}
      <div style={styles.card}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--border)" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line dataKey="value" stroke="var(--accent)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* WEEKLY */}
      <div style={styles.card}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={last7Days}>
            <Bar dataKey="value" fill="var(--accent)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TASKS */}
      <div style={styles.card}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={taskData}>
            <Bar dataKey="value" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* HEATMAP */}
      <div style={styles.card}>
        <div style={styles.heatmap}>
          {last30Days.map((d, i) => (
            <div
              key={i}
              style={{
                ...styles.cell,
                background: getColor(d.value)
              }}
            />
          ))}
        </div>
      </div>

      {/* STREAK */}
      <div style={styles.card}>
        <h3>{streak} day streak 🔥</h3>
      </div>

    </motion.div>
  );
}

// ================= UI =================
function Card({ title, value }) {
  return (
    <div style={styles.kpiCard}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: 20 },
  title: { fontSize: 28 },
  subtitle: { color: "var(--text-muted)" },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
    gap: 16
  },

  kpiCard: {
    background: "var(--card)",
    padding: 16,
    borderRadius: 12,
    border: "1px solid var(--border)"
  },

  card: {
    background: "var(--card)",
    padding: 20,
    borderRadius: 16,
    border: "1px solid var(--border)"
  },

  insight: {
    padding: 10,
    borderRadius: 10,
    background: "var(--card)"
  },

  progressBg: {
    height: 10,
    background: "var(--border)",
    borderRadius: 10
  },

  progressFill: {
    height: 10,
    background: "var(--accent)",
    borderRadius: 10
  },

  heatmap: {
    display: "grid",
    gridTemplateColumns: "repeat(10,1fr)",
    gap: 6
  },

  cell: {
    aspectRatio: 1,
    borderRadius: 4
  },

  empty: {
    padding: 30,
    color: "var(--text-muted)"
  }
};