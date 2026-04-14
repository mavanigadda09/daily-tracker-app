import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

/* ===== UTIL ===== */
const formatDuration = (sec = 0) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m === 0 ? `${s}s` : `${m}m ${s}s`;
};

const todayKey = () => new Date().toDateString();

/* ===== MAIN ===== */
export default function Tasks({ tasks = [], setTasks }) {
  const [name, setName] = useState("");

  /* ================= ADD (FIXED) ================= */
  const addTask = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const exists = tasks.some(
      t => t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return;

    setTasks(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        status: "idle",
        completed: false,
        sessions: [],
        totalDuration: 0,
        scheduledFor: todayKey(),
        priority: "medium",
        createdAt: Date.now()
      }
    ]);

    setName("");
  };

  /* ================= START ================= */
  const startTask = (id) => {
    setTasks(prev =>
      prev.map(t => {
        // stop other running tasks
        if (t.status === "running" && t.id !== id) {
          const duration = (Date.now() - t.currentStart) / 1000;

          return {
            ...t,
            status: "paused",
            totalDuration: t.totalDuration + duration,
            sessions: [
              ...t.sessions,
              { start: t.currentStart, end: Date.now(), duration }
            ]
          };
        }

        if (t.id === id) {
          return {
            ...t,
            status: "running",
            currentStart: Date.now()
          };
        }

        return t;
      })
    );
  };

  /* ================= STOP ================= */
  const stopTask = (id) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id || t.status !== "running") return t;

        const duration = (Date.now() - t.currentStart) / 1000;

        return {
          ...t,
          status: "idle",
          totalDuration: t.totalDuration + duration,
          sessions: [
            ...t.sessions,
            { start: t.currentStart, end: Date.now(), duration }
          ],
          currentStart: null
        };
      })
    );
  };

  /* ================= COMPLETE ================= */
  const completeTask = (id) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              completed: true,
              completedAt: Date.now(),
              status: "completed"
            }
          : t
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  /* ================= ACTIVE ================= */
  const activeTask = tasks.find(t => t.status === "running");

  /* ================= SUMMARY ================= */
  const totalToday = useMemo(() => {
    return tasks.reduce((sum, t) => {
      const todaySessions = t.sessions.filter(
        s => new Date(s.start).toDateString() === todayKey()
      );

      return sum + todaySessions.reduce((acc, s) => acc + s.duration, 0);
    }, 0);
  }, [tasks]);

  const completedToday = tasks.filter(
    t =>
      t.completed &&
      new Date(t.completedAt).toDateString() === todayKey()
  ).length;

  const productivity =
    tasks.length === 0
      ? 0
      : Math.round((completedToday / tasks.length) * 100);

  /* ================= SORT ================= */
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.status === "running") return -1;
      if (b.status === "running") return 1;
      if (a.completed) return 1;
      if (b.completed) return -1;
      return b.createdAt - a.createdAt;
    });
  }, [tasks]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📌 Tasks</h1>

      {/* SUMMARY */}
      <div style={styles.summary}>
        <div>⏱ {formatDuration(totalToday)}</div>
        <div>✅ {completedToday}</div>
        <div>📊 {productivity}%</div>
      </div>

      {/* ACTIVE */}
      {activeTask && (
        <motion.div style={styles.active}>
          🔥 {activeTask.name}
        </motion.div>
      )}

      {/* INPUT */}
      <div style={styles.addBox}>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter task..."
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button onClick={addTask} disabled={!name.trim()}>
          Add
        </button>
      </div>

      <Pomodoro activeTask={activeTask} />
      <WeeklyAnalytics tasks={tasks} />

      {/* TASKS */}
      <div style={styles.grid}>
        {sortedTasks.length === 0 && (
          <p style={{ opacity: 0.6 }}>No tasks yet 🚀</p>
        )}

        {sortedTasks.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            startTask={startTask}
            stopTask={stopTask}
            deleteTask={deleteTask}
            completeTask={completeTask}
          />
        ))}
      </div>
    </div>
  );
}

/* ===== TASK CARD ===== */
function TaskCard({ task, startTask, stopTask, deleteTask, completeTask }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (task.status !== "running") return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [task.status]);

  let duration = task.totalDuration;

  if (task.status === "running") {
    duration += (now - task.currentStart) / 1000;
  }

  return (
    <motion.div
      style={{
        ...styles.card,
        border:
          task.status === "running"
            ? "2px solid #22c55e"
            : "1px solid #1e293b"
      }}
    >
      <h3>{task.name}</h3>

      <p style={{ opacity: 0.7 }}>{task.status}</p>
      <p>⏳ {formatDuration(duration)}</p>

      {task.status !== "running" ? (
        <button onClick={() => startTask(task.id)}>▶</button>
      ) : (
        <button onClick={() => stopTask(task.id)}>⏹</button>
      )}

      {!task.completed && (
        <button onClick={() => completeTask(task.id)}>✔</button>
      )}

      <button onClick={() => deleteTask(task.id)}>🗑</button>
    </motion.div>
  );
}

/* ===== 🍅 ===== */
function Pomodoro({ activeTask }) {
  const [sec, setSec] = useState(1500);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!run) return;
    const i = setInterval(() => {
      setSec(s => (s <= 1 ? 1500 : s - 1));
    }, 1000);
    return () => clearInterval(i);
  }, [run]);

  return (
    <div style={styles.card}>
      <h3>🍅 Pomodoro</h3>
      <h1>
        {Math.floor(sec / 60)}:{(sec % 60).toString().padStart(2, "0")}
      </h1>

      {activeTask && <p>🎯 {activeTask.name}</p>}

      <button onClick={() => setRun(!run)}>
        {run ? "Pause" : "Start"}
      </button>
    </div>
  );
}

/* ===== 📊 ===== */
function WeeklyAnalytics({ tasks }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const data = useMemo(() => {
    const map = {};
    days.forEach(d => (map[d] = 0));

    tasks.forEach(t => {
      t.sessions?.forEach(s => {
        const d = new Date(s.start).getDay();
        map[days[d]] += s.duration / 60;
      });
    });

    return days.map(d => ({
      date: d,
      time: Math.round(map[d])
    }));
  }, [tasks]);

  return (
    <div style={styles.card}>
      <h3>📊 Weekly Analytics</h3>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line dataKey="time" stroke="#facc15" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: { padding: 20, color: "#fff" },
  title: { color: "#facc15" },
  summary: { display: "flex", gap: 20, marginBottom: 10 },
  active: {
    padding: 10,
    background: "#022c22",
    marginBottom: 10,
    borderRadius: 8
  },

  addBox: { display: "flex", gap: 10, marginBottom: 20 },
  input: { flex: 1, padding: 10 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
    gap: 16
  },

  card: {
    padding: 16,
    background: "#020617",
    borderRadius: 12
  }
};