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

  // ===== TIMER (SAFE) =====
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ===== FORMAT =====
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m === 0 ? `${s}s` : `${m}m ${s}s`;
  };

  // ===== ADD =====
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

  // ===== SORT TASKS =====
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

      {/* ADD */}
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

      {/* LIST */}
      <div style={styles.grid}>

        {sortedTasks.length === 0 && (
          <p style={styles.empty}>No tasks yet 🚀</p>
        )}

        {sortedTasks.map((t) => {

          // ===== DURATION (MEMO SAFE) =====
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

              {/* ACTIONS */}
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

              {/* DELETE */}
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