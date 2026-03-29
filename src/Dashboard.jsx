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

const theme = {
  bg: "#f9fafb",
  card: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  subtext: "#6b7280",
  primary: "#16a34a",
  primaryLight: "#22c55e"
};

export default function Dashboard({ items = [], logs = {} }) {

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
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Track your performance & consistency</p>
        </div>
        <div style={styles.profile}>👤</div>
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
              <CartesianGrid stroke={theme.border} />
              <XAxis dataKey="date" stroke={theme.subtext} />
              <YAxis stroke={theme.subtext} />
              <Tooltip />
              <Bar dataKey="completed" fill={theme.primary} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* HEATMAP */}
      <Card>
        <h3>Consistency</h3>
        <Heatmap logs={logs} />
      </Card>

    </div>
  );
}

// ================= KPI =================
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

// ================= CARD =================
function Card({ children }) {
  return (
    <div style={styles.card}>
      {children}
    </div>
  );
}

// ================= DONUT =================
function Donut({ value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <PieChart width={180} height={180}>
        <Pie data={[{value},{value:100-value}]} innerRadius={60} outerRadius={80} dataKey="value">
          <Cell fill={theme.primary} />
          <Cell fill={theme.border} />
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

  return (
    <div style={styles.heatmap}>
      {Object.keys(daily).slice(-35).map((d, i) => {
        const val = daily[d];

        const color =
          val === 0 ? "#f1f5f9" :
          val < 2 ? "#bbf7d0" :
          val < 4 ? "#4ade80" :
          "#16a34a";

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
    color: "#111827"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  title: {
    margin: 0
  },

  subtitle: {
    color: "#6b7280"
  },

  profile: {
    background: "#f3f4f6",
    padding: 10,
    borderRadius: "50%"
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 16
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: 16
  },

  card: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #e5e7eb"
  },

  kpiCard: {
    background: "#f9fafb",
    padding: 16,
    borderRadius: 16,
    border: "1px solid #e5e7eb"
  },

  highlight: {
    background: "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "#fff"
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