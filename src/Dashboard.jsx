import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Dashboard({
  items = [],
  logs = {}
}) {

  const habits = items.filter(i => i?.type === "habit");
  const activities = items.filter(i => i?.type === "activity");

  const activityCompletionRate = activities.length
    ? Math.round(
        (activities.filter(a => a.value >= a.target).length /
          activities.length) * 100
      )
    : 0;

  let totalChecks = 0;
  let completedChecks = 0;

  habits.forEach(h => {
    Object.values(h?.completed || {}).forEach(v => {
      totalChecks++;
      if (v) completedChecks++;
    });
  });

  const habitCompletionRate = totalChecks
    ? Math.round((completedChecks / totalChecks) * 100)
    : 0;

  const overall = Math.round(
    (activityCompletionRate + habitCompletionRate) / 2
  );

  const logArrays = Object.values(logs || {}).filter(Array.isArray);

  const grouped = {};
  logArrays.flat().forEach(l => {
    if (!l?.date) return;
    if (!grouped[l.date]) grouped[l.date] = 0;
    if (l.value > 0) grouped[l.date]++;
  });

  const weekly = Object.keys(grouped).map(d => ({
    date: d,
    completed: grouped[d]
  }));

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Dashboard</h1>
        <p>Track your performance & consistency</p>
      </div>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <Card title="Activity" value={activityCompletionRate + "%"} />
        <Card title="Habits" value={habitCompletionRate + "%"} />
        <Card title="Overall" value={overall + "%"} highlight />
      </div>

      {/* MAIN GRID */}
      <div style={styles.mainGrid}>

        {/* DONUT */}
        <div style={styles.card}>
          <h3>Progress</h3>
          <Donut value={overall} />
        </div>

        {/* CHART */}
        <div style={styles.card}>
          <h3>Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekly}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="completed" fill="#6366f1" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* HEATMAP */}
      <div style={styles.card}>
        <h3>Consistency</h3>
        <Heatmap logs={logs} />
      </div>

    </div>
  );
}

// ================= CARD =================
function Card({ title, value, highlight }) {
  return (
    <div style={{
      ...styles.kpiCard,
      ...(highlight && styles.highlight)
    }}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

// ================= DONUT =================
function Donut({ value }) {
  const data = [
    { value },
    { value: 100 - value }
  ];

  return (
    <div style={{ textAlign: "center" }}>
      <PieChart width={180} height={180}>
        <Pie
          data={data}
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
        >
          <Cell fill="#6366f1" />
          <Cell fill="#1e293b" />
        </Pie>
      </PieChart>
      <h2 style={{ marginTop: -110 }}>{value}%</h2>
    </div>
  );
}

// ================= HEATMAP =================
function Heatmap({ logs }) {
  const daily = {};

  Object.values(logs || {}).forEach(arr => {
    arr.forEach(l => {
      if (!l?.date) return;
      if (!daily[l.date]) daily[l.date] = 0;
      if (l.value > 0) daily[l.date]++;
    });
  });

  const days = Object.keys(daily).slice(-35);

  return (
    <div style={styles.heatmap}>
      {days.map((d, i) => {
        const val = daily[d];

        const color =
          val === 0 ? "#020617" :
          val < 2 ? "#1e293b" :
          val < 4 ? "#4f46e5" :
          "#22c55e";

        return <div key={i} style={{ ...styles.box, background: color }} />;
      })}
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    padding: 20,
    color: "#e2e8f0"
  },

  header: {
    marginBottom: 10
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: 16
  },

  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #1e293b"
  },

  kpiCard: {
    background: "#020617",
    padding: 16,
    borderRadius: 14,
    border: "1px solid #1e293b"
  },

  highlight: {
    background: "linear-gradient(135deg,#6366f1,#4f46e5)"
  },

  heatmap: {
    display: "grid",
    gridTemplateColumns: "repeat(10,1fr)",
    gap: 6
  },

  box: {
    width: 18,
    height: 18,
    borderRadius: 4
  }
};