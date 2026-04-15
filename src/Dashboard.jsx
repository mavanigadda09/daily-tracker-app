import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
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

export default function Dashboard({
  logs = {},
  weightLogs = [],
  user,
  items = [],
  tasks = []
}) {

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  /* ================= HEALTH TRACKING ================= */
  const [steps, setSteps] = useState(
    () => Number(localStorage.getItem("steps")) || 0
  );

  const [heartPoints, setHeartPoints] = useState(
    () => Number(localStorage.getItem("heartPoints")) || 0
  );

  const [workouts, setWorkouts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("workouts")) || [];
    } catch {
      return [];
    }
  });

  const [workoutInput, setWorkoutInput] = useState("");

  /* ================= SAVE HEALTH ================= */
  useEffect(() => {
    localStorage.setItem("steps", steps);
    localStorage.setItem("heartPoints", heartPoints);
    localStorage.setItem("workouts", JSON.stringify(workouts));
  }, [steps, heartPoints, workouts]);

  /* ================= AUTO STEP SIMULATION ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps(prev => prev + Math.floor(Math.random() * 3));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  /* ================= HEART POINTS ================= */
  useEffect(() => {
    const points = Math.floor(steps / 1000) * 10;
    setHeartPoints(points);
  }, [steps]);

  const addWorkout = () => {
    if (!workoutInput.trim()) return;

    const newWorkout = {
      id: Date.now(),
      name: workoutInput,
      date: new Date().toLocaleDateString()
    };

    setWorkouts(prev => [newWorkout, ...prev]);
    setWorkoutInput("");
  };

  /* ================= SAFE DATA ================= */
  const safeTasks = safeArray(tasks);
  const safeItems = safeArray(items);
  const safeWeight = safeArray(weightLogs);

  useEffect(() => {
    if (user?.name) {
      showNotification(`Welcome back, ${user.name} 🚀`, "success");
    }
  }, [user?.name]);

  /* ================= CORE ================= */
  const daily = getDailyData(logs, safeTasks);
  const heatmap = getHeatmapData(daily);

  const streak = getStreak(heatmap);
  const consistency = getConsistencyScore(heatmap);

  /* ================= TASKS ================= */
  const activeTask = safeTasks.find(t => t.status === "running");

  const totalTime = safeTasks.reduce(
    (sum, t) => sum + (t.totalDuration || 0),
    0
  );

  const completedTasks = safeTasks.filter(t => t.completed).length;

  /* ================= HABITS ================= */
  const habits = safeItems.filter(i => i.type === "habit");
  const activities = safeItems.filter(i => i.type === "activity");

  const todayKey = getKey(new Date());

  const completedHabits = habits.filter(
    h => h.completed?.[todayKey]?.done
  ).length;

  /* ================= PRODUCTIVITY ================= */
  const productivity = Math.min(
    100,
    Math.round(
      (completedTasks / (safeTasks.length || 1)) * 40 +
      (completedHabits / (habits.length || 1)) * 40 +
      consistency * 20
    )
  );

  /* ================= INSIGHTS ================= */
  const habitsPercent = useMemo(() => {
    let total = 0;
    let done = 0;

    habits.forEach(h => {
      Object.values(h.completed || {}).forEach(v => {
        total++;
        if (v?.done) done++;
      });
    });

    return total ? Math.round((done / total) * 100) : 0;
  }, [habits]);

  const activityPercent = useMemo(() => {
    let val = 0;
    let target = 0;

    activities.forEach(a => {
      val += a.value || 0;
      target += a.target || 0;
    });

    return target
      ? Math.min(Math.round((val / target) * 100), 100)
      : 0;
  }, [activities]);

  /* ================= AI ================= */
  let message = "Keep going 💪";

  if (productivity < 20) message = "Start small today 🚀";
  else if (streak >= 7) message = "🔥 You're on fire!";
  else if (activityPercent < 50) message = "Increase activity 📈";
  else message = "Great consistency 🚀";

  /* ================= CHART ================= */
  const chartData = Object.keys(daily).slice(-7).map(date => ({
    date: new Date(date).toLocaleDateString(),
    value: daily[date]
  }));

  const weightData = safeWeight.map(w => ({
    date: new Date(w.date).toLocaleDateString(),
    weight: Number(w.weight || 0)
  }));

  return (
    <motion.div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Welcome back, {user?.name || "User"} 👋
          </h1>

          <div style={styles.badges}>
            <Badge label="🔥" value={streak} />
            <Badge label="⚡" value={`${consistency}%`} />
            <Badge label="📊" value={`${productivity}%`} />
          </div>
        </div>

        <div style={styles.profile} onClick={() => navigate("/profile")}>
          👤
        </div>
      </div>

      {/* ACTIVE TASK */}
      {activeTask && (
        <motion.div style={styles.active}>
          🎯 Focus: <strong>{activeTask.name}</strong>
        </motion.div>
      )}

      {/* STATS */}
      <div style={styles.stats}>
        <Stat label="Tasks Done" value={completedTasks} />
        <Stat label="Habits Done" value={completedHabits} />
        <Stat label="Focus Time" value={formatTime(totalTime)} />
      </div>

      {/* 🔥 NEW HEALTH SECTION */}
      <div style={styles.grid}>
        <Card title="🚶 Steps">
          <h2>{steps}</h2>
          <button style={styles.button} onClick={() => setSteps(s => s + 500)}>
            +500 steps
          </button>
        </Card>

        <Card title="❤️ Heart Points">
          <Circle value={heartPoints} />
        </Card>

        <Card title="🏋️ Workouts">
          <input
            placeholder="Add workout"
            value={workoutInput}
            onChange={(e) => setWorkoutInput(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
          <button style={styles.button} onClick={addWorkout}>
            Add
          </button>

          {workouts.slice(0, 3).map(w => (
            <p key={w.id}>{w.name}</p>
          ))}
        </Card>

        <Card title="🔗 Integrations">
          <button style={styles.button}>Strava</button>
          <button style={styles.button}>MyFitnessPal</button>
        </Card>
      </div>

      {/* EXISTING GRID */}
      <div style={styles.grid}>
        <Card title="📋 Tasks">
          {safeTasks.slice(0, 3).map(t => <p key={t.id}>{t.name}</p>)}
        </Card>

        <Card title="🔥 Habits">
          {habits.slice(0, 3).map(h => <p key={h.id}>{h.name}</p>)}
        </Card>

        <Card title="📊 Habit Score">
          <Circle value={habitsPercent} />
        </Card>

        <Card title="📈 Activity Score">
          <Circle value={activityPercent} />
        </Card>
      </div>

      {/* CHART */}
      <Card title="📈 Last 7 Days">
        <ResponsiveContainer width="100%" height={180}>
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
        <p>{message}</p>
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

const Badge = ({ label, value }) => (
  <span style={styles.badge}>{label} {value}</span>
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
  container: { padding: 24 },
  header: { display: "flex", justifyContent: "space-between" },
  stats: { display: "flex", gap: 16, marginTop: 20 },
  grid: { display: "grid", gap: 20, marginTop: 20 },
  card: { padding: 20, borderRadius: 16 },
  circle: { width: 100, height: 100, borderRadius: "50%" },
  button: { padding: 10, cursor: "pointer" }
};