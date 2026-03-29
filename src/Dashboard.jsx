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

import {
  parseSmartGoal,
  calculatePercent,
  getDailyData,
  getHeatmapData,
  getStreak
} from "./utils";

import {
  getAIInsight,
  getHabitSuggestions
} from "./ai";

export default function Dashboard({ items = [], logs = {}, tasks = [], user }) {
  const navigate = useNavigate();

  const habits = items.filter(i => i?.type === "habit");
  const activities = items.filter(i => i?.type === "activity");

  // ================= KPI =================
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

  // ================= DAILY =================
  const daily = getDailyData(logs, tasks);

  const weekly = Object.keys(daily).slice(-7).map(d => ({
    date: d,
    completed: daily[d]
  }));

  // ================= GOAL =================
  const goalData = parseSmartGoal(user?.goal);

  const todayKey = new Date().toDateString();
  const todayValue = daily[todayKey] || 0;

  const goalPercent = goalData
    ? calculatePercent(todayValue, goalData.target)
    : 0;

  // ================= 🧠 AI DATA =================
  const trend =
    weekly.length >= 2
      ? weekly[weekly.length - 1].completed -
        weekly[weekly.length - 2].completed
      : 0;

  const consistency = overall / 100;

  const heatmap = getHeatmapData(daily);
  const streak = getStreak(heatmap);

  // ================= 🤖 AI =================
  const insight = getAIInsight({
    goalPercent,
    trend,
    consistency,
    todayValue,
    streak,
    heatmap,
    habits
  });

  const suggestions = getHabitSuggestions(items);

  return (
    <div style={styles.container} className="fade-in">

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

      {/* 🤖 AI COACH */}
      <div style={styles.aiCard}>
        {insight}
      </div>

      {/* 💡 AI SUGGESTIONS */}
      <div style={styles.card}>
        <h3>AI Suggestions</h3>

        {suggestions.map((s, i) => (
          <p key={i} style={styles.suggestion}>
            • {s}
          </p>
        ))}
      </div>

      {/* 🎯 GOAL */}
      <div style={styles.card}>
        <h3>Your Goal</h3>
        <p style={styles.goalText}>
          {user?.goal || "No goal set yet"}
        </p>

        {goalData && (
          <>
            <div style={styles.progressBg}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${goalPercent}%`
                }}
              />
            </div>

            <p style={styles.progressText}>
              {todayValue} / {goalData.target} {goalData.unit} ({goalPercent}%)
            </p>
          </>
        )}
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
              <Bar
                dataKey="completed"
                fill="var(--accent)"
                radius={[6,6,0,0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* CONSISTENCY */}
      <Card>
        <h3>Consistency</h3>
        <Heatmap daily={daily} />
      </Card>

      {/* 🔥 STREAK */}
      <Card>
        <h3>{streak} day streak 🔥</h3>
      </Card>

    </div>
  );
}

// ================= COMPONENTS =================
function Kpi({ title, value, highlight }) {
  return (
    <div
      style={{
        ...styles.kpiCard,
        ...(highlight && styles.highlight)
      }}
    >
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
        <Pie
          data={[{ value }, { value: 100 - value }]}
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
        >
          <Cell fill="var(--accent)" />
          <Cell fill="var(--border)" />
        </Pie>
      </PieChart>
      <h2 style={{ marginTop: -110 }}>{value}%</h2>
    </div>
  );
}

function Heatmap({ daily }) {
  const lastDays = Object.keys(daily).slice(-35);

  return (
    <div style={styles.heatmap}>
      {lastDays.map((d, i) => {
        const val = daily[d];

        const color =
          val === 0 ? "#1f2937" :
          val < 30 ? "#4ade80" :
          val < 60 ? "#22c55e" :
          "#16a34a";

        return (
          <div
            key={i}
            style={{ ...styles.box, background: color }}
          />
        );
      })}
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 24
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  title: { fontSize: 28 },

  subtitle: { color: "var(--text-muted)" },

  aiCard: {
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    padding: 16,
    borderRadius: 12,
    color: "#fff",
    fontWeight: 500
  },

  suggestion: {
    fontSize: 14,
    color: "var(--text-muted)",
    marginTop: 6
  },

  goalText: {
    color: "var(--accent)",
    fontWeight: "bold",
    marginBottom: 10
  },

  progressBg: {
    height: 10,
    background: "var(--border)",
    borderRadius: 10
  },

  progressFill: {
    height: 10,
    background: "var(--accent)",
    borderRadius: 10
  },

  progressText: {
    marginTop: 6,
    fontSize: 13,
    color: "var(--text-muted)"
  },

  profile: {
    background: "var(--card)",
    padding: 10,
    borderRadius: "50%",
    cursor: "pointer",
    border: "1px solid var(--border)"
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: 16
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
    gap: 16
  },

  card: {
    background: "var(--card)",
    backdropFilter: "blur(12px)",
    padding: 20,
    borderRadius: 16,
    border: "1px solid var(--border)"
  },

  kpiCard: {
    background: "var(--card)",
    padding: 16,
    borderRadius: 16,
    border: "1px solid var(--border)"
  },

  highlight: {
    background: "var(--accent)",
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