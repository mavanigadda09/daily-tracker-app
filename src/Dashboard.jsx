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

import { logoutUser } from "./firebase";
import { Home, Activity, Target, BarChart2, CheckSquare } from "lucide-react";

export default function Dashboard({
  items = [],
  logs = {},
  onNavigate,
  activePage = "dashboard"
}) {

  // ================= DATA =================
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

  // ================= UI =================
  return (
    <div style={styles.app}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div>
          <h2 style={styles.logo}>Ignira OS</h2>

          <MenuItem icon={<Home size={18} />} label="Dashboard" active={activePage==="dashboard"} onClick={()=>onNavigate("dashboard")} />
          <MenuItem icon={<Activity size={18} />} label="Activities" active={activePage==="activities"} onClick={()=>onNavigate("activities")} />
          <MenuItem icon={<CheckSquare size={18} />} label="Habits" active={activePage==="habits"} onClick={()=>onNavigate("habits")} />
          <MenuItem icon={<Target size={18} />} label="Goals" active={activePage==="goals"} onClick={()=>onNavigate("goals")} />
          <MenuItem icon={<BarChart2 size={18} />} label="Analytics" active={activePage==="analytics"} onClick={()=>onNavigate("analytics")} />
        </div>

        <button style={styles.logout} onClick={logoutUser}>
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* TOP */}
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Track your performance & consistency</p>
          </div>
          <div style={styles.profile}>👤</div>
        </div>

        {/* KPI */}
        <div style={styles.kpiGrid}>
          <Card title="Activity" value={activityCompletionRate + "%"} />
          <Card title="Habits" value={habitCompletionRate + "%"} />
          <Card title="Overall" value={overall + "%"} highlight />
        </div>

        {/* GRID */}
        <div style={styles.mainGrid}>

          <div style={styles.card}>
            <h3>Progress</h3>
            <Donut value={overall} />
          </div>

          <div style={styles.card}>
            <h3>Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekly}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" radius={[6,6,0,0]} />
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
    </div>
  );
}

// ================= MENU ITEM =================
function MenuItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.menuItem,
        ...(active && styles.activeItem)
      }}
    >
      {icon}
      <span>{label}</span>
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
      <p style={{color:"#94a3b8"}}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

// ================= DONUT =================
function Donut({ value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <PieChart width={180} height={180}>
        <Pie data={[{value},{value:100-value}]} innerRadius={60} outerRadius={80} dataKey="value">
          <Cell fill="#22c55e" />
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

  return (
    <div style={styles.heatmap}>
      {Object.keys(daily).slice(-35).map((d, i) => {
        const val = daily[d];
        const color =
          val === 0 ? "#020617" :
          val < 2 ? "#1e293b" :
          val < 4 ? "#22c55e" :
          "#16a34a";

        return <div key={i} style={{ ...styles.box, background: color }} />;
      })}
    </div>
  );
}

// ================= STYLES =================
const styles = {
  app: {
    display: "flex",
    height: "100vh",
    background: "#020617",
    color: "#e2e8f0"
  },

  sidebar: {
    width: 230,
    padding: 20,
    background: "linear-gradient(180deg,#166534,#020617)",
    borderRight: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },

  logo: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: "bold"
  },

  menuItem: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    cursor: "pointer",
    color: "#94a3b8"
  },

  activeItem: {
    background: "#22c55e",
    color: "#000",
    fontWeight: "bold"
  },

  logout: {
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: 30
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  title: {
    fontSize: 28
  },

  subtitle: {
    color: "#94a3b8"
  },

  profile: {
    background: "#1e293b",
    padding: 10,
    borderRadius: "50%"
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: 16,
    marginTop: 20
  },

  card: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    padding: 20,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.05)"
  },

  kpiCard: {
    background: "rgba(2,6,23,0.9)",
    padding: 18,
    borderRadius: 18,
    border: "1px solid #1e293b"
  },

  highlight: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)"
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