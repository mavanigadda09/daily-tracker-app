import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

/* =========================
   UTILITIES
========================= */

const formatDuration = (sec = 0) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m === 0 ? `${s}s` : `${m}m ${s}s`;
};

const getToday = () => new Date().toDateString();

/* =========================
   COMPONENT
========================= */

export default function Tasks({
  tasks = [],
  addTask,
  startTask,
  endTask,
  deleteTask
}) {
  const [name, setName] = useState("");
  const [now, setNow] = useState(Date.now());
  const [pomodoro, setPomodoro] = useState(25 * 60);
  const [runningPomodoro, setRunningPomodoro] = useState(false);

  /* =========================
     TIMER (optimized)
  ========================= */
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  /* =========================
     POMODORO LOGIC
  ========================= */
  useEffect(() => {
    if (!runningPomodoro) return;

    const timer = setInterval(() => {
      setPomodoro((p) => {
        if (p <= 1) {
          setRunningPomodoro(false);
          return 25 * 60;
        }
        return p - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [runningPomodoro]);

  /* =========================
     ADD TASK (VALIDATION FIX)
  ========================= */
  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const exists = tasks.some(
      t => t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) return;

    addTask({
      id: Date.now(),
      name: trimmed,
      status: "idle",
      totalDuration: 0,
      sessions: [],
      createdAt: Date.now()
    });

    setName("");
  };

  /* =========================
     START TASK (ONLY ONE RUNNING)
  ========================= */
  const handleStart = (task) => {
    tasks.forEach(t => {
      if (t.status === "running") {
        handleStop(t);
      }
    });

    startTask(task.id);
  };

  /* =========================
     STOP TASK (FIXED DURATION)
  ========================= */
  const handleStop = (task) => {
    const end = Date.now();
    const start = new Date(task.start).getTime();

    const duration = (end - start) / 1000;

    endTask(task.id, duration, getToday());
  };

  /* =========================
     SORT TASKS
  ========================= */
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.status === "running") return -1;
      if (b.status === "running") return 1;
      return 0;
    });
  }, [tasks]);

  /* =========================
     ACTIVE TASK
  ========================= */
  const activeTask = tasks.find(t => t.status === "running");

  /* =========================
     ANALYTICS (FIXED)
  ========================= */
  const weeklyData = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const map = {};

    days.forEach(d => (map[d] = 0));

    tasks.forEach(t => {
      t.sessions?.forEach(s => {
        const d = new Date(s.start).getDay();
        map[days[d]] += s.duration / 60; // minutes
      });
    });

    return days.map(d => ({
      day: d,
      minutes: Math.round(map[d])
    }));
  }, [tasks]);

  /* =========================
     SUMMARY
  ========================= */
  const totalToday = useMemo(() => {
    return tasks.reduce((acc, t) => {
      return acc + (t.totalDuration || 0);
    }, 0);
  }, [tasks]);

  const completedToday = tasks.filter(
    t => t.completed && new Date(t.completedAt).toDateString() === getToday()
  ).length;

  /* =========================
     UI
  ========================= */

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <h1>📌 Tasks</h1>
      <p>⏱ {formatDuration(totalToday)} | ✅ {completedToday} done</p>

      {/* INPUT */}
      <div style={styles.addBox}>
        <input
          style={styles.input}
          placeholder="Enter task..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* ACTIVE TASK */}
      {activeTask && (
        <div style={styles.active}>
          🔥 Working on: <b>{activeTask.name}</b>
        </div>
      )}

      {/* POMODORO */}
      <div style={styles.card}>
        <h3>🍅 Pomodoro</h3>
        <h1>{formatDuration(pomodoro)}</h1>

        <button onClick={() => setRunningPomodoro(!runningPomodoro)}>
          {runningPomodoro ? "Pause" : "Start"}
        </button>

        <button onClick={() => setPomodoro(25 * 60)}>
          Reset
        </button>
      </div>

      {/* ANALYTICS */}
      <div style={styles.card}>
        <h3>📊 Weekly Focus (minutes)</h3>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <XAxis dataKey="day" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="minutes"
              stroke="#22c55e"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TASK LIST */}
      <div style={styles.grid}>
        {sortedTasks.map(t => {
          let duration = t.totalDuration || 0;

          if (t.status === "running" && t.start) {
            duration += (now - new Date(t.start)) / 1000;
          }

          return (
            <div
              key={t.id}
              style={{
                ...styles.card,
                border:
                  t.status === "running"
                    ? "2px solid #22c55e"
                    : "1px solid #333"
              }}
            >
              <h3>{t.name}</h3>

              <p>
                {t.status === "running" ? "🟢 Running" : "⚪ Idle"}
              </p>

              <p>⏳ {formatDuration(duration)}</p>

              {t.status !== "running" ? (
                <button onClick={() => handleStart(t)}>
                  ▶ Start
                </button>
              ) : (
                <button onClick={() => handleStop(t)}>
                  ⏹ Stop
                </button>
              )}

              <button onClick={() => deleteTask(t.id)}>
                🗑 Delete
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles = {
  container: { padding: 20, color: "white" },
  addBox: { display: "flex", gap: 10 },
  input: { flex: 1, padding: 8 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: 12,
    marginTop: 20
  },

  card: {
    padding: 12,
    background: "#0f172a",
    borderRadius: 8
  },

  active: {
    marginTop: 10,
    padding: 10,
    background: "#022c22",
    borderRadius: 8
  }
};