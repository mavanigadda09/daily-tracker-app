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

      <div style={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p>Track your performance & consistency</p>
        </div>
        <div style={styles.profile}>👤</div>
      </div>

      <div style={styles.kpiGrid}>
        <Card title="Activity" value={activityCompletionRate + "%"} />
        <Card title="Habits" value={habitCompletionRate + "%"} />
        <Card title="Overall" value={overall + "%"} highlight />
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <h3>Progress</h3>
          <Donut value={overall} />
        </div>

        <div style={styles.card}>
          <h3>Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekly}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="completed" fill="#16a34a" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <h3>Consistency</h3>
        <Heatmap logs={logs} />
      </div>

    </div>
  );
}

// reusable components
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

function Donut({ value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <PieChart width={180} height={180}>
        <Pie data={[{value},{value:100-value}]} innerRadius={60} outerRadius={80} dataKey="value">
          <Cell fill="#16a34a" />
          <Cell fill="#e5e7eb" />
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
          val === 0 ? "#f1f5f9" :
          val < 2 ? "#bbf7d0" :
          val < 4 ? "#4ade80" :
          "#16a34a";

        return <div key={i} style={{ ...styles.box, background: color }} />;
      })}
    </div>
  );
}

// styles
const styles = {
  container: {
    background: "#ffffff",
    minHeight: "100vh",
    padding: 30,
    color: "#111"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  profile: {
    background: "#f1f5f9",
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
    gap: 16,
    marginTop: 20
  },

  card: {
    background: "#fff",
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