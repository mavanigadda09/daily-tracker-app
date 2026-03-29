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

export default function Analytics({ logs = {}, tasks = [] }) {

  if ((!logs || typeof logs !== "object") && !tasks.length) {
    return <p style={styles.empty}>No data available</p>;
  }

  const daily = {};
  const taskTotals = {};

  const logArrays = Object.values(logs).filter(Array.isArray);

  logArrays.forEach((activityLogs) => {
    activityLogs.forEach((l) => {
      if (!l?.date) return;
      if (!daily[l.date]) daily[l.date] = 0;
      daily[l.date] += Number(l.value || 0);
    });
  });

  tasks.forEach((t) => {
    if (!Array.isArray(t.logs)) return;

    t.logs.forEach((log) => {
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

  if (chartData.length === 0) {
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
      ? values[values.length - 1] - values[values.length - 2]
      : 0;

  const consistency =
    values.filter(v => v > 0).length / values.length;

  const score = Math.min(
    100,
    Math.round((avg * 0.5 + consistency * 50 + (trend > 0 ? 10 : 0)))
  );

  const insight =
    score > 80
      ? "🔥 Excellent consistency!"
      : score > 50
      ? "📈 Good progress!"
      : "⚡ Try to stay consistent!";

  const taskData = Object.keys(taskTotals)
    .map((name) => ({
      name,
      value: taskTotals[name]
    }))
    .sort((a, b) => b.value - a.value);

  const last7Days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();

    last7Days.push({
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: daily[key] || 0
    });
  }

  const last30Days = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();

    last30Days.push({
      date: key,
      value: daily[key] || 0
    });
  }

  const getColor = (value) => {
    if (value === 0) return "#e5e7eb";
    if (value < 30) return "#86efac";
    if (value < 60) return "#4ade80";
    if (value < 120) return "#22c55e";
    return "#16a34a";
  };

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

      <div style={styles.insight}>{insight}</div>

      {/* DAILY */}
      <motion.div style={styles.card} whileHover={{ y: -5 }}>
        <h3>📈 Daily Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* WEEKLY */}
      <motion.div style={styles.card} whileHover={{ y: -5 }}>
        <h3>📅 Weekly Overview</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={last7Days}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* TASKS */}
      <motion.div style={styles.card} whileHover={{ y: -5 }}>
        <h3>🏆 Top Tasks</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={taskData}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* HEATMAP */}
      <motion.div style={styles.card}>
        <h3>🟩 Heatmap</h3>
        <div style={styles.heatmap}>
          {last30Days.map((d, i) => (
            <motion.div
              key={i}
              style={{
                ...styles.cell,
                background: getColor(d.value)
              }}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>
      </motion.div>

      {/* STREAK */}
      <motion.div style={styles.card}>
        <h3>🔥 Streak</h3>
        <div style={styles.big}>{streak} days</div>
      </motion.div>

    </motion.div>
  );
}

const styles = {
  container: {
    padding: 30,
    background: "#f8fafc", // ✅ FIXED
    maxWidth: 1200,        // ✅ CENTERED
    margin: "0 auto",
    minHeight: "100vh"
  },

  title: {
    fontSize: 28,
    color: "#111827"
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: 20
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 20
  },

  kpiCard: {
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
  },

  kpiTitle: {
    color: "#6b7280"
  },

  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    marginBottom: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },

  insight: {
    background: "#eef2ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20
  },

  heatmap: {
    display: "grid",
    gridTemplateColumns: "repeat(10, 1fr)",
    gap: 6
  },

  cell: {
    aspectRatio: "1",
    borderRadius: 4
  },

  big: {
    fontSize: 40,
    textAlign: "center",
    color: "#16a34a"
  },

  empty: {
    padding: 30
  }
};