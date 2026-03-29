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
    if (value === 0) return "#1e293b";
    if (value < 30) return "#4ade80";
    if (value < 60) return "#22c55e";
    if (value < 120) return "#16a34a";
    return "#15803d";
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
      transition={{ duration: 0.6 }}
    >

      <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }}>
        ✨ Analytics
      </motion.h1>

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <p>{k.title}</p>
            <h2>{k.value}</h2>
          </motion.div>
        ))}
      </div>

      <motion.div style={styles.insight} whileHover={{ scale: 1.02 }}>
        {insight}
      </motion.div>

      {/* CARD ANIMATION WRAPPER */}
      {[
        { title: "📈 Daily Trend", content:
          <LineChart data={chartData}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={3} />
          </LineChart>
        },
        { title: "📅 Weekly Overview", content:
          <BarChart data={last7Days}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="value" fill="#60a5fa" />
          </BarChart>
        }
      ].map((section, i) => (
        <motion.div
          key={i}
          style={styles.card}
          whileHover={{ y: -5 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.2 }}
        >
          <h3>{section.title}</h3>
          <ResponsiveContainer width="100%" height={280}>
            {section.content}
          </ResponsiveContainer>
        </motion.div>
      ))}

      {/* HEATMAP */}
      <motion.div style={styles.card} whileHover={{ scale: 1.02 }}>
        <h3>🟩 Heatmap</h3>
        <div style={styles.heatmap}>
          {last30Days.map((d, i) => (
            <motion.div
              key={i}
              style={{
                ...styles.cell,
                background: getColor(d.value)
              }}
              whileHover={{ scale: 1.3 }}
            />
          ))}
        </div>
      </motion.div>

      {/* STREAK */}
      <motion.div style={styles.card} whileHover={{ scale: 1.05 }}>
        <h3>🔥 Streak</h3>
        <div style={styles.big}>{streak} days</div>
      </motion.div>

    </motion.div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: 30,
    color: "#e2e8f0",
    background: "linear-gradient(135deg, #020617, #0f172a)"
  },

  subtitle: { color: "#94a3b8" },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16
  },

  kpiCard: {
    backdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 16
  },

  card: {
    backdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16
  },

  insight: {
    background: "rgba(255,255,255,0.05)",
    padding: 14,
    borderRadius: 12
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
    fontSize: 42,
    textAlign: "center",
    color: "#4ade80"
  },

  empty: {
    padding: 30
  }
};