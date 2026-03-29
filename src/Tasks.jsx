import { useState, useEffect } from "react";

export default function Tasks({
  tasks = [],
  addTask,
  startTask,
  endTask
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

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <h1 style={styles.title}>Tasks</h1>
      <p style={styles.subtitle}>Track your time & productivity</p>

      {/* ADD TASK */}
      <div style={styles.addBox}>
        <input
          style={styles.input}
          placeholder="Enter task name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              addTask(name.trim());
              setName("");
            }
          }}
        />

        <button
          style={styles.addBtn}
          onClick={() => {
            if (!name.trim()) return;
            addTask(name.trim());
            setName("");
          }}
        >
          Add
        </button>
      </div>

      {/* TASK LIST */}
      <div style={styles.grid}>
        {tasks.length === 0 && (
          <p style={styles.empty}>No tasks yet</p>
        )}

        {tasks.map((t) => {
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
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  title: {
    fontSize: 28
  },

  subtitle: {
    color: "var(--text-muted)"
  },

  addBox: {
    display: "flex",
    gap: 10,
    background: "var(--card)",
    padding: 16,
    borderRadius: 12,
    border: "1px solid var(--border)"
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "#020617",
    color: "#fff"
  },

  addBtn: {
    background: "var(--accent)",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16
  },

  card: {
    background: "var(--card)",
    padding: 16,
    borderRadius: 12,
    border: "1px solid var(--border)"
  },

  running: {
    color: "#22c55e"
  },

  stopped: {
    color: "var(--text-muted)"
  },

  time: {
    fontSize: 12,
    color: "var(--text-muted)"
  },

  duration: {
    marginTop: 6,
    color: "#facc15"
  },

  start: {
    marginTop: 10,
    background: "#22c55e",
    border: "none",
    padding: 8,
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  stop: {
    marginTop: 10,
    background: "#ef4444",
    border: "none",
    padding: 8,
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  empty: {
    color: "var(--text-muted)"
  }
};