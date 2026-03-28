import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function Analytics({ logs }) {

  // ================= SAFE CHECK =================
  if (!logs || typeof logs !== "object") {
    return <p style={styles.empty}>No data available</p>;
  }

  const logArrays = Object.values(logs).filter(Array.isArray);

  if (logArrays.length === 0) {
    return <p style={styles.empty}>No logs yet</p>;
  }

  // ================= GROUP BY DATE =================
  const daily = {};

  logArrays.forEach((activityLogs) => {
    activityLogs.forEach((l) => {
      if (!l?.date) return;

      if (!daily[l.date]) daily[l.date] = 0;
      daily[l.date] += Number(l.value || 0);
    });
  });

  const chartData = Object.keys(daily).map((date) => ({
    date,
    value: daily[date]
  }));

  if (chartData.length === 0) {
    return <p style={styles.empty}>No usable data</p>;
  }

  // ================= ANALYTICS =================
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

  const insight =
    avg > 80
      ? "🔥 High performance!"
      : trend > 0
      ? "📈 Improving!"
      : "⚡ Stay consistent!";

  // ================= UI =================
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Daily Progress</h1>

      <div style={styles.kpiGrid}>
        <Card title="Total" value={total} />
        <Card title="Average" value={avg} />
        <Card title="Best Day" value={best.date} />
        <Card title="Trend" value={trend >= 0 ? "+" + trend : trend} />
      </div>

      <div style={styles.insight}>{insight}</div>

      <div style={styles.card}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ================= CARD =================
function Card({ title, value }) {
  return (
    <div style={styles.kpiCard}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  title: {
    fontSize: 28,
    fontWeight: 600,
    color: "#e2e8f0"
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16
  },

  kpiCard: {
    background: "#0f172a",
    padding: 16,
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.1)",
    color: "#e2e8f0"
  },

  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.1)"
  },

  insight: {
    background: "#1e293b",
    padding: 14,
    borderRadius: 10,
    border: "1px solid #334155",
    color: "#e2e8f0"
  },

  empty: {
    color: "#94a3b8"
  }
};