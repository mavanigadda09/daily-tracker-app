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

// ===== UTIL =====
const formatDuration = (sec = 0) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m === 0 ? `${s}s` : `${m}m ${s}s`;
};

// ===== MAIN =====
export default function Tasks() {

  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tasks")) || [];
    } catch {
      return [];
    }
  });

  const [name, setName] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

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
        scheduledFor: new Date().toDateString(),
        priority: "medium"
      }
    ]);

    setName("");
  };

  const startTask = (id) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: "running",
            currentStart: Date.now()
          };
        }

        if (t.status === "running") {
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

        return t;
      })
    );
  };

  const stopTask = (id) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;

        const duration = (Date.now() - t.currentStart) / 1000;

        return {
          ...t,
          status: "idle",
          totalDuration: t.totalDuration + duration,
          sessions: [
            ...t.sessions,
            { start: t.currentStart, end: Date.now(), duration }
          ]
        };
      })
    );
  };

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
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem("tasks", JSON.stringify(updated));
      return updated;
    });
  };

  // ===== ACTIVE TASK =====
  const activeTask = tasks.find(t => t.status === "running");

  // ===== SUMMARY =====
  const today = new Date().toDateString();

  const totalTimeToday = tasks.reduce(
    (sum, t) => sum + t.totalDuration,
    0
  );

  const completedToday = tasks.filter(
    t => t.completed && new Date(t.completedAt).toDateString() === today
  ).length;

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.status === "running") return -1;
      if (b.status === "running") return 1;
      return 0;
    });
  }, [tasks]);

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>📌 Tasks</h1>

      {/* SUMMARY */}
      <div style={styles.summary}>
        <div>⏱ {formatDuration(totalTimeToday)}</div>
        <div>✅ {completedToday} done</div>
      </div>

      {/* 🎯 ACTIVE TASK */}
      {activeTask && (
        <div style={styles.activeFocus}>
          🎯 Focus: {activeTask.name}
        </div>
      )}

      {/* INPUT */}
      <div style={styles.addBox}>
        <input
          style={styles.input}
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Enter task..."
        />
        <button onClick={addTask} style={styles.addBtn}>
          Add
        </button>
      </div>

      {/* 🍅 */}
      <Pomodoro />

      {/* 📊 */}
      <WeeklyAnalytics tasks={tasks} />

      {/* TASKS */}
      <div style={styles.grid}>
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

// ===== TASK CARD =====
function TaskCard({ task, startTask, stopTask, deleteTask, completeTask }) {

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (task.status !== "running") return;

    const i = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(i);
  }, [task.status]);

  let duration = task.totalDuration;

  if (task.status === "running") {
    duration += (now - task.currentStart) / 1000;
  }

  return (
    <motion.div style={styles.card} whileHover={{ scale: 1.02 }}>
      <h3>{task.name}</h3>
      <p>{task.status}</p>
      <p>⏳ {formatDuration(duration)}</p>

      {task.status !== "running" ? (
        <button onClick={()=>startTask(task.id)}>▶</button>
      ) : (
        <button onClick={()=>stopTask(task.id)}>⏹</button>
      )}

      {!task.completed && (
        <button onClick={()=>completeTask(task.id)}>✔</button>
      )}

      <button onClick={()=>deleteTask(task.id)}>🗑</button>
    </motion.div>
  );
}

// ===== 🍅 POMODORO =====
function Pomodoro() {
  const [sec, setSec] = useState(1500);
  const [run, setRun] = useState(false);
  const [mode, setMode] = useState("focus");

  useEffect(() => {
    if (!run) return;

    const i = setInterval(() => {
      setSec(s => {
        if (s <= 1) {
          if (mode === "focus") {
            setMode("break");
            return 300;
          } else {
            setMode("focus");
            return 1500;
          }
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(i);
  }, [run, mode]);

  return (
    <div style={styles.card}>
      <h3>🍅 {mode}</h3>
      <h1>{Math.floor(sec/60)}:{(sec%60).toString().padStart(2,"0")}</h1>

      <button onClick={()=>setRun(!run)}>
        {run ? "Pause" : "Start"}
      </button>

      <button onClick={()=>setSec(mode==="focus"?1500:300)}>
        Reset
      </button>
    </div>
  );
}

// ===== 📊 ANALYTICS =====
function WeeklyAnalytics({ tasks }) {

  const data = useMemo(() => {
    const map = {};

    tasks.forEach(t => {
      t.sessions?.forEach(s => {
        const d = new Date(s.start).toLocaleDateString("en-US",{weekday:"short"});

        if (!map[d]) map[d] = { date: d, time: 0 };

        map[d].time += (s.duration || 0) / 60; // minutes
      });
    });

    return Object.values(map);
  }, [tasks]);

  if (data.length === 0) {
    return <div style={styles.card}>No data yet 🚀</div>;
  }

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

// ===== STYLES =====
const styles = {
  container:{padding:20,color:"#fff"},
  title:{color:"#facc15"},
  summary:{display:"flex",gap:20,marginBottom:10},
  activeFocus:{marginBottom:10,color:"#facc15"},

  addBox:{display:"flex",gap:10,marginBottom:20},
  input:{flex:1,padding:10},
  addBtn:{background:"#22c55e",border:"none",padding:"10px",color:"#fff"},

  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16},
  card:{padding:16,background:"#020617",borderRadius:12}
};