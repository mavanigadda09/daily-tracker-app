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

import { useNavigate } from "react-router-dom";

export default function Dashboard({ items = [], logs = {}, user }) {
  const navigate = useNavigate();

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

  const grouped = {};
  Object.values(logs || {}).flat().forEach(l => {
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
        <div>
          <h1 style={styles.title}>
            Welcome, {user?.name} 👋
          </h1>
          <p style={styles.subtitle}>
            Let’s achieve your goals today
          </p>
        </div>

        <div
          style={styles.profile}
          onClick={() => navigate("/profile")}
        >
          👤
        </div>
      </div>

      {/* 🎯 GOAL */}
      <div style={styles.card}>
        <h3>Your Goal</h3>
        <p style={styles.goalText}>
          {user?.goal || "No goal set yet"}
        </p>
      </div>

      {/* KPI */}
      <div style={styles.kpiGrid}>
        <Kpi title="Activity" value={activityCompletionRate} />
        <Kpi title="Habits" value={habitCompletionRate} />
        <Kpi title="Overall" value={overall} highlight />
      </div>

      {/* MAIN */}
      <div style={styles.mainGrid}>
        <Card>
          <h3>Progress</h3>
          <Donut value={overall} />
        </Card>

        <Card>
          <h3>Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekly}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip />
              <Bar dataKey="completed" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3>Consistency</h3>
        <Heatmap logs={logs} />
      </Card>

    </div>
  );
}

// ================= COMPONENTS =================
function Kpi({ title, value, highlight }) {
  return (
    <div style={{
      ...styles.kpiCard,
      ...(highlight && styles.highlight)
    }}>
      <p>{title}</p>
      <h2>{value}%</h2>
    </div>
  );
}

function Card({ children }) {
  return <div style={styles.card}>{children}</div>;
}

function Donut({ value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <PieChart width={180} height={180}>
        <Pie data={[{ value }, { value: 100 - value }]} innerRadius={60} outerRadius={80} dataKey="value">
          <Cell fill="var(--accent)" />
          <Cell fill="var(--border)" />
        </Pie>
      </PieChart>
      <h2 style={{ marginTop: -110 }}>{value}%</h2>
    </div>
  );
}

function Heatmap({ logs }) {
  const daily = {};

  Object.values(logs || {}).forEach(arr => {
    arr.forEach(l => {
      if (!l?.date) return;
      if (!daily[l.date]) daily[l.date] = 0;
      if (l.value > 0) daily[l.date]++;
    });
  });

  return (
    <div style={styles.heatmap}>
      {Object.keys(daily).slice(-35).map((d, i) => {
        const val = daily[d];
        const color =
          val === 0 ? "#1f2937" :
          val < 2 ? "#4ade80" :
          val < 4 ? "#22c55e" :
          "#16a34a";

        return <div key={i} style={{ ...styles.box, background: color }} />;
      })}
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: { display: "flex", flexDirection: "column", gap: 24 },
  header: { display: "flex", justifyContent: "space-between" },
  subtitle: { color: "var(--text-muted)" },
  goalText: { color: "var(--accent)", fontWeight: "bold" },
  profile: {
    background: "var(--card)",
    padding: 10,
    borderRadius: "50%",
    cursor: "pointer",
    border: "1px solid var(--border)"
  },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 16 },
  mainGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 },
  card: { background: "var(--card)", padding: 20, borderRadius: 16, border: "1px solid var(--border)" },
  kpiCard: { background: "var(--card)", padding: 16, borderRadius: 16, border: "1px solid var(--border)" },
  highlight: { background: "var(--accent)", color: "#fff" },
  heatmap: { display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 6 },
  box: { width: 18, height: 18, borderRadius: 4 }
};