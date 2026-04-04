import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Dashboard({
  logs = {},
  weightLogs = [],
  user
}) {
  const navigate = useNavigate();

  // ===== MOCK DATA =====
  const fitnessData = [
    { day: "Mon", steps: 4000 },
    { day: "Tue", steps: 6500 },
    { day: "Wed", steps: 8000 },
    { day: "Thu", steps: 7200 },
    { day: "Fri", steps: 9000 },
    { day: "Sat", steps: 11000 },
    { day: "Sun", steps: 7000 }
  ];

  const weightData = weightLogs.map(w => ({
    date: new Date(w.date).toLocaleDateString(),
    weight: w.weight
  }));

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Welcome back, {user?.name} 👋
          </h1>
          <p style={styles.subtitle}>Here's your activity overview</p>
        </div>

        <div style={styles.profile} onClick={() => navigate("/profile")}>
          👤
        </div>
      </div>

      {/* STATS */}
      <div style={styles.stats}>

        <div style={styles.statCard}>
          <span>🚶</span>
          <h3>Steps</h3>
          <p>8,245</p>
        </div>

        <div style={styles.statCard}>
          <span>🔥</span>
          <h3>Calories</h3>
          <p>1,230 kcal</p>
        </div>

        <div style={styles.statCard}>
          <span>⏱</span>
          <h3>Active Time</h3>
          <p>75 min</p>
        </div>

      </div>

      {/* GRID */}
      <div style={styles.grid}>

        {/* STEPS CHART */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Weekly Steps</h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fitnessData}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="steps"
                stroke="#22c55e"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* WEIGHT */}
        {weightData.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🏋️ Weight Progress</h3>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#4ade80"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI CARD */}
        <div style={styles.highlightCard}>
          <h3>🧠 AI Insight</h3>
          <p>
            You're consistent this week. Increase activity slightly 🚀
          </p>
        </div>

      </div>

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "20px",
    background: "var(--bg)",
    color: "var(--text)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30
  },

  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 600
  },

  subtitle: {
    margin: 0,
    fontSize: 14,
    color: "var(--text-muted)"
  },

  profile: {
    background: "var(--accent)",
    padding: 10,
    borderRadius: "50%",
    cursor: "pointer"
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
    marginBottom: 30
  },

  statCard: {
    background: "var(--card)",
    padding: 18,
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20
  },

  card: {
    background: "var(--card)",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
  },

  cardTitle: {
    marginBottom: 10
  },

  highlightCard: {
    background: "linear-gradient(135deg, #16a34a, #4ade80)",
    padding: 20,
    borderRadius: 16,
    color: "#022c22",
    fontWeight: 500,
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
  }
};