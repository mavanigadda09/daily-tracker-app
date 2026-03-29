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

// ================= SMART GOAL PARSER =================
const parseSmartGoal = (goal) => {
  if (!goal) return null;

  const numMatch = goal.match(/\d+/);
  const value = numMatch ? Number(numMatch[0]) : null;

  const lower = goal.toLowerCase();

  let unit = "count";

  if (lower.includes("hour") || lower.includes("hr")) {
    unit = "minutes";
  } else if (lower.includes("min")) {
    unit = "minutes";
  } else if (lower.includes("cal")) {
    unit = "calories";
  } else if (lower.includes("page")) {
    unit = "pages";
  }

  let target = value;

  // convert hours → minutes
  if (unit === "minutes" && lower.includes("hour")) {
    target = value * 60;
  }

  return { target, unit };
};

export default function Analytics({ logs = {}, tasks = [], user }) {

  if ((!logs || typeof logs !== "object") && !tasks.length) {
    return <p style={styles.empty}>No data available</p>;
  }

  const daily = {};
  const taskTotals = {};

  // ================= MERGE DATA =================
  Object.values(logs).flat().forEach((l) => {
    if (!l?.date) return;
    if (!daily[l.date]) daily[l.date] = 0;
    daily[l.date] += Number(l.value || 0);
  });

  tasks.forEach((t) => {
    t.logs?.forEach((log) => {
      if (!log?.date) return;

      const minutes = Math.round((log.duration || 0) / 60);

      if (!daily[log.date]) daily[log.date] = 0;
      daily[log.date] += minutes;

      if (!taskTotals[t.name]) taskTotals[t.name] = 0;
      taskTotals[t.name] += minutes;
    });
  });

  const chartData = Object.keys(daily).map((date) => ({
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

  // ================= 🎯 SMART GOAL =================
  const goalData = parseSmartGoal(user?.goal);

  const todayKey = new Date().toDateString();
  const todayValue = daily[todayKey] || 0;

  const goalPercent = goalData?.target
    ? Math.min(Math.round((todayValue / goalData.target) * 100), 100)
    : 0;

  const goalInsight = user?.goal
    ? `🎯 Goal: ${user.goal}`
    : "Set a goal to stay focused";

  // ================= TASK BREAKDOWN =================
  const taskData = Object.keys(taskTotals)
    .map(name => ({ name, value: taskTotals[name] }))
    .sort((a, b) => b.value - a.value);

  // ================= WEEKLY =================
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: daily[d.toDateString()] || 0
    };
  });

  // ================= HEATMAP =================
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toDateString(),
      value: daily[d.toDateString()] || 0
    };
  });

  const getColor = (v) =>
    v === 0 ? "#1f2937"
    : v < 30 ? "#4ade80"
    : v < 60 ? "#22c55e"
    : "#16a34a";

  // ================= STREAK =================
  let streak = 0;
  for (let i = last30Days.length - 1; i >= 0; i--) {
    if (last30Days[i].value > 0) streak++;
    else break;
  }

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >

      <h1 style={styles.title}>Analytics</h1>
      <p style={styles.subtitle}>Your performance insights</p>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        {[ 
          { title: "Total", value: total },
          { title: "Average", value: avg },
          { title: "Best Day", value: best.date },
          { title: "Score", value: score }
        ].map((k, i) => (
          <motion.div
            key={i}
            style={styles.kpiCard}
            whileHover={{ scale: 1.05 }}
          >
            <p style={styles.kpiTitle}>{k.title}</p>
            <h2>{k.value}</h2>
          </motion.div>
        ))}
      </div>

      {/* INSIGHTS */}
      <div style={styles.insight}>{insight}</div>
      <div style={styles.insight}>{goalInsight}</div>

      {/* 🎯 GOAL PROGRESS */}
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

          <p style={styles.subtitle}>
            {todayValue} / {goalData.target} {goalData.unit} ({goalPercent}%)
          </p>
        </div>
      )}

      {/* DAILY */}
      <div style={styles.card}>
        <h3>Daily Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* WEEKLY */}
      <div style={styles.card}>
        <h3>Weekly</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={last7Days}>
            <CartesianGrid stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip />
            <Bar dataKey="value" fill="var(--accent)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TASKS */}
      <div style={styles.card}>
        <h3>Top Tasks</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={taskData}>
            <CartesianGrid stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip />
            <Bar dataKey="value" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* HEATMAP */}
      <div style={styles.card}>
        <h3>Heatmap</h3>
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
        <h3>Streak</h3>
        <div style={styles.big}>{streak} days</div>
      </div>

    </motion.div>
  );
}

// ================= STYLES =================
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

  kpiTitle: { color: "var(--text-muted)" },

  card: {
    background: "var(--card)",
    padding: 20,
    borderRadius: 16,
    border: "1px solid var(--border)"
  },

  insight: {
    background: "var(--card)",
    padding: 12,
    borderRadius: 10,
    border: "1px solid var(--border)"
  },

  progressBg: {
    height: 10,
    background: "var(--border)",
    borderRadius: 10,
    marginTop: 10
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
    aspectRatio: "1",
    borderRadius: 4
  },

  big: {
    fontSize: 36,
    textAlign: "center",
    color: "var(--accent)"
  },

  empty: {
    padding: 30,
    color: "var(--text-muted)"
  }
};