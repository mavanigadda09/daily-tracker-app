import { useState, useEffect } from "react";

export default function Tasks({
  tasks = [],
  addTask,
  startTask,
  endTask
}) {
  const [name, setName] = useState("");
  const [now, setNow] = useState(Date.now());

  // ================= LIVE TIMER =================
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ================= FORMAT TIME =================
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);

    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div>
      <h1 style={styles.title}>⏱ Task Tracker</h1>

      {/* ================= ADD TASK ================= */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Task name (e.g. Medicine)"
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
          style={styles.btn}
          onClick={() => {
            if (!name.trim()) return;
            addTask(name.trim());
            setName("");
          }}
        >
          Add Task
        </button>
      </div>

      {/* ================= TASK LIST ================= */}
      <div style={styles.grid}>
        {tasks.length === 0 && (
          <p style={{ color: "#94a3b8" }}>No tasks added</p>
        )}

        {tasks.map((t) => {
          let duration = t.duration || 0;

          if (t.running && t.start) {
            duration =
              (now - new Date(t.start)) / 1000;
          }

          return (
            <div key={t.id} style={styles.cardHover}>
              <h3 style={styles.taskName}>{t.name}</h3>

              {/* STATUS */}
              <p style={t.running ? styles.running : styles.stopped}>
                {t.running ? "🟢 Running" : "⚪ Not running"}
              </p>

              {/* TIME */}
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

              {/* DURATION */}
              {duration > 0 && (
                <p style={styles.duration}>
                  ⏳ {formatDuration(duration)}
                </p>
              )}

              {/* CONTROLS */}
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

                    // 🔥 AUTO LOGGING HERE
                    endTask(t.id, durationSec, date);
                  }}
                >
                  ⏹ End
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
  title: {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 20,
    color: "#e2e8f0"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20
  },

  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid rgba(148,163,184,0.1)"
  },

  cardHover: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.1)",
    transition: "0.3s",
    cursor: "pointer"
  },

  taskName: {
    color: "#e2e8f0"
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff",
    marginRight: 10
  },

  btn: {
    background: "#6366f1",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  start: {
    background: "#22c55e",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    marginTop: 10,
    cursor: "pointer"
  },

  stop: {
    background: "#ef4444",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    marginTop: 10,
    cursor: "pointer"
  },

  running: {
    color: "#22c55e"
  },

  stopped: {
    color: "#94a3b8"
  },

  time: {
    fontSize: 12,
    color: "#94a3b8"
  },

  duration: {
    marginTop: 5,
    color: "#facc15",
    fontWeight: 500
  }
};