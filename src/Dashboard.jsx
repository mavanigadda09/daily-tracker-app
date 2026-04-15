import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from "recharts";
import { useNotification } from "./context/NotificationContext.jsx";
import { motion } from "framer-motion";
import { theme } from "./theme";

import {
  getConsistencyScore,
  getDailyData,
  getHeatmapData,
  getStreak
} from "./ai/utils.js";

/* ===== SAFE ===== */
const safeArray = (v) => (Array.isArray(v) ? v : []);

const formatTime = (sec = 0) => {
  const m = Math.floor(sec / 60);
  return m ? `${m}m` : `${sec}s`;
};

const getKey = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/* ===== RING COMPONENT (ANIMATED) ===== */
const Ring = ({ value, label, color }) => {
  const radius = 40;
  const stroke = 8;
  const normalized = radius - stroke / 2;
  const circumference = normalized * 2 * Math.PI;

  return (
    <div style={{ textAlign: "center" }}>
      <svg height={100} width={100}>
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalized}
          cx="50"
          cy="50"
        />

        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalized}
          cx="50"
          cy="50"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (value / 100) * circumference
          }}
          transition={{ duration: 1 }}
        />
      </svg>

      <div style={{ marginTop: -70, fontWeight: "bold" }}>
        {value}%
      </div>

      <p style={{ marginTop: 10 }}>{label}</p>
    </div>
  );
};

export default function Dashboard({
  logs = {},
  weightLogs = [],
  user,
  items = [],
  tasks = []
}) {

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  /* ================= HEALTH ================= */
  const [steps, setSteps] = useState(() => Number(localStorage.getItem("steps")) || 0);
  const [heartPoints, setHeartPoints] = useState(() => Number(localStorage.getItem("heartPoints")) || 0);
  const [workouts, setWorkouts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("workouts")) || []; }
    catch { return []; }
  });
  const [workoutInput, setWorkoutInput] = useState("");

  /* ===== GOALS ===== */
  const STEP_GOAL = 10000;

  useEffect(() => {
    localStorage.setItem("steps", steps);
    localStorage.setItem("heartPoints", heartPoints);
    localStorage.setItem("workouts", JSON.stringify(workouts));
  }, [steps, heartPoints, workouts]);

  useEffect(() => {
    const i = setInterval(() => {
      setSteps(s => s + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    setHeartPoints(Math.floor(steps / 1000) * 10);
  }, [steps]);

  const addWorkout = () => {
    if (!workoutInput.trim()) return;
    setWorkouts(prev => [
      { id: Date.now(), name: workoutInput },
      ...prev
    ]);
    setWorkoutInput("");
  };

  /* ===== FUTURE API ===== */
  const fetchHealthData = async () => {
    try {
      // future API integration
    } catch {}
  };

  /* ================= DATA ================= */
  const safeTasks = safeArray(tasks);
  const safeItems = safeArray(items);

  const daily = getDailyData(logs, safeTasks);
  const heatmap = getHeatmapData(daily);

  const streak = getStreak(heatmap);
  const consistency = getConsistencyScore(heatmap);

  const habits = safeItems.filter(i => i.type === "habit");
  const activities = safeItems.filter(i => i.type === "activity");

  const todayKey = getKey(new Date());

  const completedHabits = habits.filter(
    h => h.completed?.[todayKey]?.done
  ).length;

  const completedTasks = safeTasks.filter(t => t.completed).length;

  const totalTime = safeTasks.reduce(
    (sum, t) => sum + (t.totalDuration || 0),
    0
  );

  const productivity = Math.min(
    100,
    Math.round(
      (completedTasks / (safeTasks.length || 1)) * 40 +
      (completedHabits / (habits.length || 1)) * 40 +
      consistency * 20
    )
  );

  const habitsPercent = useMemo(() => {
    let total = 0, done = 0;
    habits.forEach(h => {
      Object.values(h.completed || {}).forEach(v => {
        total++; if (v?.done) done++;
      });
    });
    return total ? Math.round((done / total) * 100) : 0;
  }, [habits]);

  const activityPercent = useMemo(() => {
    let val = 0, target = 0;
    activities.forEach(a => {
      val += a.value || 0;
      target += a.target || 0;
    });
    return target ? Math.min(Math.round((val / target) * 100), 100) : 0;
  }, [activities]);

  const chartData = Object.keys(daily).slice(-7).map(date => ({
    date: new Date(date).toLocaleDateString(),
    value: daily[date]
  }));

  useEffect(() => {
    if (user?.name) {
      showNotification(`Welcome back, ${user.name} 🚀`, "success");
    }
  }, [user?.name]);

  return (
    <motion.div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Welcome back, {user?.name || "User"} 👋</h1>
        <div onClick={() => navigate("/profile")} style={styles.profile}>👤</div>
      </div>

      {/* STATS */}
      <div style={styles.stats}>
        <Stat label="Tasks Done" value={completedTasks} />
        <Stat label="Habits Done" value={completedHabits} />
        <Stat label="Focus Time" value={formatTime(totalTime)} />
      </div>

      {/* 🔥 GOOGLE FIT UI */}
      <div style={styles.grid}>
        <Card title="🔥 Daily Progress">

          <div style={styles.rings}>
            <Ring value={Math.min(100, Math.round((steps / STEP_GOAL) * 100))} label="Steps" color="#22c55e" />
            <Ring value={heartPoints} label="Heart" color="#ef4444" />
            <Ring value={activityPercent} label="Activity" color="#3b82f6" />
          </div>

          <p style={{ marginTop: 10 }}>
            🚶 {steps} / {STEP_GOAL} steps
          </p>

        </Card>

        <Card title="🏋️ Workouts">
          <input
            value={workoutInput}
            onChange={(e) => setWorkoutInput(e.target.value)}
            style={styles.input}
            placeholder="Add workout"
          />
          <button style={styles.button} onClick={addWorkout}>Add</button>
          {workouts.slice(0, 3).map(w => <p key={w.id}>{w.name}</p>)}
        </Card>

        <Card title="🔗 Integrations">
          <button style={styles.button}>Connect Strava</button>
          <button style={styles.button}>Connect MyFitnessPal</button>
        </Card>
      </div>

      {/* EXISTING */}
      <div style={styles.grid}>
        <Card title="📊 Habit Score"><Circle value={habitsPercent} /></Card>
        <Card title="📈 Activity Score"><Circle value={activityPercent} /></Card>
      </div>

      {/* CHART */}
      <Card title="📈 Last 7 Days">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line dataKey="value" stroke={theme.colors.primary} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* AI */}
      <Card title="🤖 AI Coach">
        <p>{productivity < 20 ? "Start small today 🚀" : "Great consistency 🚀"}</p>
      </Card>

    </motion.div>
  );
}

/* ===== COMPONENTS ===== */
const Stat = ({ label, value }) => (
  <div style={styles.statCard}>
    <h2>{value}</h2>
    <p>{label}</p>
  </div>
);

const Card = ({ title, children }) => (
  <div style={styles.card}>
    <h3>{title}</h3>
    {children}
  </div>
);

const Circle = ({ value }) => (
  <div style={styles.circle}>{value}%</div>
);

/* ===== STYLES ===== */
const styles = {
  container: {
    padding: 24,
    background: theme.colors.background,
    color: theme.colors.text
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  profile: { cursor: "pointer" },

  stats: {
    display: "flex",
    gap: 20,
    marginTop: 20
  },

  statCard: {
    padding: 16,
    borderRadius: 12,
    background: theme.colors.card,
    border: `1px solid ${theme.colors.border}`
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    marginTop: 20
  },

  rings: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center"
  },

  card: {
    padding: 20,
    borderRadius: 16,
    background: theme.colors.card,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
  },

  circle: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.1)"
  },

  button: {
    marginTop: 10,
    padding: "8px 12px",
    borderRadius: 8,
    background: theme.colors.primary,
    border: "none",
    cursor: "pointer"
  },

  input: {
    width: "100%",
    padding: 8,
    marginTop: 8
  }
};