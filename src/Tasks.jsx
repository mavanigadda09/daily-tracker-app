import { useState, useEffect, useMemo } from "react";

export default function Tasks({
  tasks = [],
  addTask,
  startTask,
  endTask,
  deleteTask
}) {

  const [name, setName] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m === 0 ? `${s}s` : `${m}m ${s}s`;
  };

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const exists = tasks.some(
      t => t.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) return;

    addTask(trimmed);
    setName("");
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.running) return -1;
      if (b.running) return 1;
      return 0;
    });
  }, [tasks]);

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>📌 Tasks</h1>
      <p style={styles.subtitle}>Track your time & productivity</p>

      <div style={styles.addBox}>
        <input
          style={styles.input}
          placeholder="Enter task name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />

        <button
          style={{
            ...styles.addBtn,
            opacity: name.trim() ? 1 : 0.6
          }}
          disabled={!name.trim()}
          onClick={handleAdd}
        >
          Add
        </button>
      </div>

      <div style={styles.grid}>

        {sortedTasks.length === 0 && (
          <p style={styles.empty}>No tasks yet 🚀</p>
        )}

        {sortedTasks.map((t) => {

          let duration = t.duration || 0;

          if (t.running && t.start) {
            duration = (now - new Date(t.start)) / 1000;
          }

          return (
            <div key={t.id} style={styles.card}>

              <h3>{t.name}</h3>

              <p style={t.running ? styles.running : styles.stopped}>
                {t.running ? "Running" : "Stopped"}
              </p>

              {t.start && (
                <p style={styles.time}>
                  Start: {new Date(t.start).toLocaleTimeString()}
                </p>
              )}

              {t.end && (
                <p style={styles.time}>
                  End: {new Date(t.end).toLocaleTimeString()}
                </p>
              )}

              {duration > 0 && (
                <p style={styles.duration}>
                  ⏳ {formatDuration(duration)}
                </p>
              )}

              {!t.running ? (
                <button
                  style={styles.start}
                  onClick={() => startTask(t.id)}
                >
                  ▶ Start
                </button>
              ) : (
                <button
                  style={styles.stop}
                  onClick={() => {
                    const endTime = Date.now();
                    const startTime = new Date(t.start).getTime();

                    const durationSec =
                      (endTime - startTime) / 1000;

                    const date = new Date().toDateString();

                    endTask(t.id, durationSec, date);
                  }}
                >
                  ⏹ Stop
                </button>
              )}

              <button
                style={styles.delete}
                onClick={() => deleteTask?.(t.id)}
              >
                🗑 Delete
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
}


// ✅ REQUIRED STYLES (FIX)
const styles = {
  container: { padding: 20, color: "white" },
  title: { fontSize: 24 },
  subtitle: { color: "#94a3b8", marginBottom: 10 },

  addBox: { display: "flex", gap: 10, marginBottom: 15 },
  input: { padding: 8, flex: 1 },

  addBtn: {
    padding: "8px 16px",
    background: "#22c55e",
    border: "none",
    borderRadius: 6,
    color: "white",
    cursor: "pointer"
  },

  grid: { display: "grid", gap: 12 },

  card: {
    padding: 12,
    background: "#0f172a",
    borderRadius: 8
  },

  running: { color: "#22c55e" },
  stopped: { color: "#ef4444" },

  time: { fontSize: 12, color: "#94a3b8" },
  duration: { marginTop: 5 },

  start: {
    background: "#22c55e",
    border: "none",
    padding: "6px 10px",
    marginTop: 8,
    borderRadius: 6,
    cursor: "pointer"
  },

  stop: {
    background: "#ef4444",
    border: "none",
    padding: "6px 10px",
    marginTop: 8,
    borderRadius: 6,
    cursor: "pointer"
  },

  delete: {
    marginTop: 8,
    background: "#374151",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer"
  },

  empty: { color: "#94a3b8" }
};