import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

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

  // ===== SAVE =====
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // ===== ADD =====
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

  // ===== START =====
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
        // stop others
        if (t.status === "running") {
          const duration =
            (Date.now() - t.currentStart) / 1000;

          return {
            ...t,
            status: "paused",
            totalDuration: t.totalDuration + duration,
            sessions: [
              ...t.sessions,
              {
                start: t.currentStart,
                end: Date.now(),
                duration
              }
            ]
          };
        }
        return t;
      })
    );
  };

  // ===== STOP =====
  const stopTask = (id) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;

        const duration =
          (Date.now() - t.currentStart) / 1000;

        return {
          ...t,
          status: "idle",
          totalDuration: t.totalDuration + duration,
          sessions: [
            ...t.sessions,
            {
              start: t.currentStart,
              end: Date.now(),
              duration
            }
          ]
        };
      })
    );
  };

  // ===== COMPLETE =====
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

  // ===== DELETE =====
  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // ===== SUMMARY =====
  const today = new Date().toDateString();

  const todayTasks = tasks.filter(
    t => t.scheduledFor === today
  );

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
        <div>📋 {todayTasks.length} planned</div>
      </div>

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

      {/* LIST */}
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

// ===== CARD =====
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
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        ...styles.card,
        ...(task.status === "running" ? styles.activeCard : {})
      }}
    >
      <h3>{task.name}</h3>

      <p style={styles.status}>{task.status}</p>

      <p>⏳ {formatDuration(duration)}</p>

      {/* ACTIONS */}
      {task.status !== "running" ? (
        <button onClick={()=>startTask(task.id)} style={styles.start}>
          ▶
        </button>
      ) : (
        <button onClick={()=>stopTask(task.id)} style={styles.stop}>
          ⏹
        </button>
      )}

      {!task.completed && (
        <button onClick={()=>completeTask(task.id)} style={styles.complete}>
          ✔
        </button>
      )}

      <button onClick={()=>deleteTask(task.id)} style={styles.delete}>
        🗑
      </button>
    </motion.div>
  );
}

// ===== STYLES =====
const styles = {
  container:{padding:20,color:"#fff"},
  title:{color:"#facc15"},

  summary:{
    display:"flex",
    gap:20,
    marginBottom:20
  },

  addBox:{display:"flex",gap:10,marginBottom:20},
  input:{flex:1,padding:10},

  addBtn:{
    background:"#22c55e",
    border:"none",
    padding:"10px 16px",
    borderRadius:6,
    color:"#fff"
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",
    gap:16
  },

  card:{
    padding:16,
    background:"#020617",
    borderRadius:12
  },

  activeCard:{
    border:"1px solid #facc15",
    boxShadow:"0 0 15px #facc15"
  },

  status:{fontSize:12,opacity:0.7},

  start:{background:"#22c55e",marginTop:10},
  stop:{background:"#ef4444",marginTop:10},
  complete:{background:"#3b82f6",marginTop:10},
  delete:{background:"#374151",marginTop:10}
};