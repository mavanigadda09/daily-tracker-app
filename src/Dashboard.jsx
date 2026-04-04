import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard({
  logs = {},
  weightLogs = [],
  user
}) {
  const navigate = useNavigate();

  // ===== MOCK FITNESS DATA =====
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
        <h1>Welcome back, {user?.name} 👋</h1>

        <div style={styles.profile} onClick={() => navigate("/profile")}>
          👤
        </div>
      </div>

      {/* FITNESS CARDS */}
      <div style={styles.stats}>

        <div style={styles.statCard}>
          <h3>🚶 Steps</h3>
          <p>8,245</p>
        </div>

        <div style={styles.statCard}>
          <h3>🔥 Calories</h3>
          <p>1,230 kcal</p>
        </div>

        <div style={styles.statCard}>
          <h3>⏱ Active Time</h3>
          <p>75 min</p>
        </div>

      </div>

      {/* CHARTS */}
      <div style={styles.grid}>

        {/* STEPS CHART */}
        <div style={styles.card}>
          <h3>📊 Weekly Steps</h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fitnessData}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="steps" stroke="#22c55e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* WEIGHT CHART */}
        {weightData.length > 0 && (
          <div style={styles.card}>
            <h3>🏋️ Weight Progress</h3>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#4ade80" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI CARD */}
        <div style={styles.highlightCard}>
          <h3>🧠 AI Insight</h3>
          <p>You're consistent this week. Increase activity slightly 🚀</p>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: 30,
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "#fff",
    fontFamily: "Poppins, sans-serif"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 30
  },

  profile: {
    background: "#22c55e",
    padding: 10,
    borderRadius: "50%",
    cursor: "pointer"
  },

  stats: {
    display: "flex",
    gap: 20,
    marginBottom: 30
  },

  statCard: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16
  },

  highlightCard: {
    background: "linear-gradient(135deg, #22c55e, #4ade80)",
    padding: 20,
    borderRadius: 16,
    color: "#022c22"
  }
};