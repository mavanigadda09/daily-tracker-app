import {
  LineChart, Line,
  BarChart,  Bar,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { motion } from "framer-motion";

import { CHART_COLORS, CHART_GRID, CHART_DEFAULTS } from "../utils/theme";

import {
  parseSmartGoal,
  calculatePercent,
  getDailyData,
  getWeeklyData,
  getHeatmapData,
  getStreak,
  getTaskBreakdown,
} from "../utils/productivityUtils";

import { getAIInsight } from "../ai/ai";

const formatTime = (sec = 0) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
};

/**
 * Heatmap intensity — uses Phoenix gold palette instead of
 * arbitrary green shades that didn't match the design system.
 */
const getHeatColor = (v) => {
  if (v === 0)   return "rgba(255,255,255,0.05)";
  if (v < 30)    return "rgba(250,204,21,0.25)";
  if (v < 60)    return "rgba(250,204,21,0.55)";
  return               "rgba(250,204,21,0.90)";
};

export default function Analytics({ logs = {}, tasks = [], user }) {

  if ((!logs || typeof logs !== "object") && !tasks.length) {
    return <p style={styles.empty}>No data available yet.</p>;
  }

  const daily    = getDailyData(logs, tasks);
  const chartData = Object.keys(daily).map((date) => ({
    date:  new Date(date).toLocaleDateString(),
    value: daily[date],
  }));

  if (!chartData.length) {
    return <p style={styles.empty}>No usable data yet.</p>;
  }

  const values  = chartData.map((d) => d.value);
  const total   = values.reduce((a, b) => a + b, 0);
  const avg     = Math.round(total / values.length);
  const best    = chartData.reduce((max, d) => (d.value > max.value ? d : max), chartData[0]);
  const trend   = values.length >= 2 ? values.at(-1) - values.at(-2) : 0;
  const consistency = values.filter((v) => v > 0).length / values.length;
  const score   = Math.min(100, Math.round(avg * 0.4 + consistency * 60 + (trend > 0 ? 5 : 0)));
  const totalTime = tasks.reduce((sum, t) => sum + (t.totalDuration || 0), 0);

  const insight  = getAIInsight({ goalPercent: score, trend });
  const goalData = parseSmartGoal(user?.goal);

  const todayKey   = new Date().toDateString();
  const todayValue = daily[todayKey] || 0;
  const goalPercent = goalData ? calculatePercent(todayValue, goalData.target) : 0;

  const last7Days  = getWeeklyData(daily);
  const last30Days = getHeatmapData(daily);
  const streak     = getStreak(last30Days);
  const taskData   = getTaskBreakdown(tasks);

  // Detect theme for chart grid lines
  const isDark = document.body.getAttribute("data-theme") !== "light";
  const gridColor = isDark ? CHART_GRID.dark : CHART_GRID.light;

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 style={styles.title}>📊 Analytics</h1>
      <p style={styles.subtitle}>Your productivity dashboard</p>

      {/* AI INSIGHT */}
      <div style={styles.aiCard}>{insight}</div>

      {/* KPIs */}
      <div style={styles.kpiGrid}>
        <Kpi title="Total"      value={total} />
        <Kpi title="Average"    value={avg} />
        <Kpi title="Best Day"   value={best.date} />
        <Kpi title="Score"      value={`${score}`} highlight />
        <Kpi title="Time Spent" value={formatTime(totalTime)} />
      </div>

      {/* GOAL PROGRESS */}
      {goalData && (
        <div className="glass-panel" style={styles.section}>
          <h3 style={styles.sectionTitle}>🎯 Goal Progress</h3>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${goalPercent}%` }} />
          </div>
          <p style={styles.sub}>
            {todayValue} / {goalData.target} {goalData.unit} ({goalPercent}%)
          </p>
        </div>
      )}

      {/* DAILY TREND */}
      <div className="glass-panel" style={styles.section}>
        <h3 style={styles.sectionTitle}>📈 Daily Trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={CHART_DEFAULTS.margin}>
            <CartesianGrid stroke={gridColor} />
            <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
              }}
            />
            <Line
              dataKey="value"
              stroke={CHART_COLORS.gold}
              strokeWidth={2.5}
              dot={false}
              animationDuration={CHART_DEFAULTS.animationDuration}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* WEEKLY OVERVIEW */}
      <div className="glass-panel" style={styles.section}>
        <h3 style={styles.sectionTitle}>📅 Weekly Overview</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={last7Days} margin={CHART_DEFAULTS.margin}>
            <CartesianGrid stroke={gridColor} />
            <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
              }}
            />
            <Bar
              dataKey="value"
              fill={CHART_COLORS.orange}
              radius={[6, 6, 0, 0]}
              animationDuration={CHART_DEFAULTS.animationDuration}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TOP TASKS */}
      <div className="glass-panel" style={styles.section}>
        <h3 style={styles.sectionTitle}>🏆 Top Tasks</h3>
        {taskData.length === 0 ? (
          <p style={styles.sub}>No task data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={taskData} margin={CHART_DEFAULTS.margin}>
              <CartesianGrid stroke={gridColor} />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                }}
              />
              <Bar
                dataKey="value"
                fill={CHART_COLORS.gold}
                radius={[6, 6, 0, 0]}
                animationDuration={CHART_DEFAULTS.animationDuration}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* HEATMAP */}
      <div className="glass-panel" style={styles.section}>
        <h3 style={styles.sectionTitle}>🟩 30-Day Consistency</h3>
        <div style={styles.heatmap}>
          {last30Days.map((d, i) => (
            <div
              key={i}
              title={`${d.date}: ${d.value}`}
              style={{ ...styles.heatCell, background: getHeatColor(d.value) }}
            />
          ))}
        </div>
      </div>

      {/* STREAK */}
      <div className="glass-panel" style={{ ...styles.section, textAlign: "center" }}>
        <p style={{ fontSize: 36 }}>🔥</p>
        <h2 style={{ color: "var(--accent)", fontSize: 28 }}>{streak}</h2>
        <p style={styles.sub}>day streak</p>
      </div>

    </motion.div>
  );
}

/* ─── KPI Card ─────────────────────────────────────────────── */
function Kpi({ title, value, highlight }) {
  return (
    <div
      className="glass-panel"
      style={{
        ...styles.kpiCard,
        ...(highlight ? styles.kpiHighlight : {}),
      }}
    >
      <p style={{ color: highlight ? "rgba(2,6,23,0.7)" : "var(--text-muted)", fontSize: 12 }}>
        {title}
      </p>
      <h2 style={{ color: highlight ? "#020617" : "var(--text)", fontSize: 22 }}>
        {value}
      </h2>
    </div>
  );
}

/* ─── Styles ───────────────────────────────────────────────── */
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    padding: "24px 16px",
    maxWidth: 900,
    margin: "0 auto",
  },
  title:    { fontSize: 28, fontWeight: "bold", color: "var(--text)" },
  subtitle: { color: "var(--text-muted)", fontSize: 14, marginTop: -12 },
  sub:      { color: "var(--text-muted)", fontSize: 13, marginTop: 8 },

  aiCard: {
    background: "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(249,115,22,0.15))",
    border: "1px solid rgba(250,204,21,0.25)",
    padding: 16,
    borderRadius: "var(--radius)",
    color: "var(--text)",
    fontSize: 14,
    lineHeight: 1.6,
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  },
  kpiCard: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  kpiHighlight: {
    background: "linear-gradient(135deg, var(--accent), var(--accent-orange))",
    border: "none",
  },

  section:      { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 16 },

  progressBg: {
    height: 10,
    background: "var(--border)",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, var(--accent), var(--accent-orange))",
    borderRadius: 10,
    transition: "width 0.4s ease",
  },

  heatmap: {
    display: "grid",
    gridTemplateColumns: "repeat(10, 1fr)",
    gap: 6,
  },
  heatCell: {
    aspectRatio: "1",
    borderRadius: 4,
    transition: "background 0.2s",
  },

  empty: {
    padding: 40,
    color: "var(--text-muted)",
    textAlign: "center",
    fontSize: 14,
  },
};