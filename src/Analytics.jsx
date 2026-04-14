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
import { theme } from "./theme";

import {
  parseSmartGoal,
  calculatePercent,
  getDailyData,
  getWeeklyData,
  getHeatmapData,
  getStreak,
  getTaskBreakdown
} from "./ai/utils";

import { getAIInsight } from "./ai/ai";

/* ===== FORMAT TIME ===== */
const formatTime = (sec = 0) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
};

export default function Analytics({ logs = {}, tasks = [], user }) {

  if ((!logs || typeof logs !== "object") && !tasks.length) {
    return <p style={styles.empty}>No data available</p>;
  }

  const daily = getDailyData(logs, tasks);

  const chartData = Object.keys(daily).map(date => ({
    date: new Date(date).toLocaleDateString(),
    value: daily[date]
  }));

  if (!chartData.length) {
    return <p style={styles.empty}>No usable data</p>;
  }

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
    Math.round(avg * 0.4 + consistency * 60 + (trend > 0 ? 5 : 0))
  );

  const totalTime = tasks.reduce(
    (sum, t) => sum + (t.totalDuration || 0),
    0
  );

  const insight = getAIInsight({
    goalPercent: score,
    trend
  });

  const goalData = parseSmartGoal(user?.goal);

  const todayKey = new Date().toDateString();
  const todayValue = daily[todayKey] || 0;

  const goalPercent = goalData
    ? calculatePercent(todayValue, goalData.target)
    : 0;

  const last7Days = getWeeklyData(daily);
  const last30Days = getHeatmapData(daily);
  const streak = getStreak(last30Days);
  const taskData = getTaskBreakdown(tasks);

  const getColor = (v) =>
    v === 0
      ? theme.colors.border
      : v < 30
      ? "#4ade80"
      : v < 60
      ? "#22c55e"
      : "#16a34a";

  return (
    <motion.div style={styles.container}>

      <h1 style={styles.title}>📊 Analytics</h1>
      <p style={styles.subtitle}>Your productivity dashboard</p>

      {/* AI */}
      <div style={styles.aiCard}>{insight}</div>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <Kpi title="Total" value={total} />
        <Kpi title="Average" value={avg} />
        <Kpi title="Best Day" value={best.date} />
        <Kpi title="Score" value={score} highlight />
        <Kpi title="Time Spent" value={formatTime(totalTime)} />
      </div>

      {/* GOAL */}
      {goalData && (
        <div style={styles.card}>
          <h3>🎯 Goal Progress</h3>

          <div style={styles.progressBg}>
            <div
              style={{
                ...styles.progressFill,
                width: `${goalPercent}%`
              }}
            />
          </div>

          <p style={styles.sub}>
            {todayValue} / {goalData.target} {goalData.unit} ({goalPercent}%)
          </p>
        </div>
      )}

      {/* DAILY */}
      <div style={styles.card}>
        <h3>📈 Daily Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid stroke={theme.colors.border} />
            <XAxis stroke={theme.colors.textMuted} dataKey="date" />
            <YAxis stroke={theme.colors.textMuted} />
            <Tooltip />
            <Line dataKey="value" stroke={theme.colors.chartPrimary} strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* WEEKLY */}
      <div style={styles.card}>
        <h3>📅 Weekly Overview</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={last7Days}>
            <CartesianGrid stroke={theme.colors.border} />
            <XAxis stroke={theme.colors.textMuted} dataKey="date" />
            <YAxis stroke={theme.colors.textMuted} />
            <Tooltip />
            <Bar dataKey="value" fill={theme.colors.chartSecondary} radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TASKS */}
      <div style={styles.card}>
        <h3>🏆 Top Tasks</h3>
        {taskData.length === 0 ? (
          <p style={styles.sub}>No task data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskData}>
              <CartesianGrid stroke={theme.colors.border} />
              <XAxis stroke={theme.colors.textMuted} dataKey="name" />
              <YAxis stroke={theme.colors.textMuted} />
              <Tooltip />
              <Bar dataKey="value" fill={theme.colors.primary} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* HEATMAP */}
      <div style={styles.card}>
        <h3>🟩 Consistency Heatmap</h3>
        <div style={styles.heatmap}>
          {last30Days.map((d, i) => (
            <div
              key={i}
              title={`${d.date}: ${d.value}`}
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
        <h3>🔥 {streak} Day Streak</h3>
      </div>

    </motion.div>
  );
}

/* ===== COMPONENT ===== */
function Kpi({ title, value, highlight }) {
  return (
    <div style={{
      ...styles.kpiCard,
      ...(highlight && styles.highlight)
    }}>
      <p style={{ color: theme.colors.textMuted }}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: { display:"flex",flexDirection:"column",gap:24 },

  title:{ fontSize:28, color: theme.colors.text },
  subtitle:{ color: theme.colors.textMuted },

  sub:{ color: theme.colors.textMuted, fontSize:13 },

  aiCard:{
    background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
    padding:16,
    borderRadius:12,
    color:"#fff"
  },

  kpiGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",
    gap:16
  },

  kpiCard:{
    ...theme.components.card
  },

  highlight:{ background: theme.colors.primary, color:"#000" },

  card:{
    ...theme.components.card
  },

  progressBg:{
    height:10,
    background: theme.colors.border,
    borderRadius:10
  },

  progressFill:{
    height:10,
    background: theme.colors.success,
    borderRadius:10
  },

  heatmap:{
    display:"grid",
    gridTemplateColumns:"repeat(10,1fr)",
    gap:6
  },

  cell:{
    aspectRatio:1,
    borderRadius:4
  },

  empty:{
    padding:30,
    color: theme.colors.textMuted
  }
};