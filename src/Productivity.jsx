import { useState, useMemo } from "react";

/* ================= MAIN ================= */
export default function Productivity({ tasks = [], setTasks, items = [], setItems }) {

  const [name, setName] = useState("");
  const [mode, setMode] = useState("task"); // task | activity

  /* ================= ADD ================= */
  const addItem = () => {
    if (!name.trim()) return;

    if (mode === "task") {
      setTasks(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name,
          status: "idle",
          totalDuration: 0,
          sessions: []
        }
      ]);
    } else {
      setItems(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name,
          type: "activity",
          value: 0,
          target: 100
        }
      ]);
    }

    setName("");
  };

  /* ================= TASK ACTIONS ================= */
  const startTask = (id) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, status: "running", currentStart: Date.now() }
          : t
      )
    );
  };

  const stopTask = (id) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id || t.status !== "running") return t;

        const duration = (Date.now() - t.currentStart) / 1000;

        return {
          ...t,
          status: "idle",
          totalDuration: t.totalDuration + duration,
          sessions: [...t.sessions, { duration }]
        };
      })
    );
  };

  /* ================= ACTIVITY ACTIONS ================= */
  const updateActivity = (id, val) => {
    setItems(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, value: Math.max((i.value || 0) + val, 0) }
          : i
      )
    );
  };

  const activities = items.filter(i => i.type === "activity");

  /* ================= UI ================= */
  return (
    <div style={styles.container}>
      <h1>🔥 Productivity</h1>

      {/* MODE SWITCH */}
      <div style={styles.switch}>
        <button onClick={() => setMode("task")}>Tasks</button>
        <button onClick={() => setMode("activity")}>Activities</button>
      </div>

      {/* ADD */}
      <div style={styles.add}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Add ${mode}`}
        />
        <button onClick={addItem}>Add</button>
      </div>

      {/* TASKS */}
      {mode === "task" && (
        <div>
          <h2>⏱ Tasks</h2>
          {tasks.map(t => (
            <div key={t.id} style={styles.card}>
              <b>{t.name}</b>
              <p>{t.status}</p>

              {t.status !== "running" ? (
                <button onClick={() => startTask(t.id)}>Start</button>
              ) : (
                <button onClick={() => stopTask(t.id)}>Stop</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ACTIVITIES */}
      {mode === "activity" && (
        <div>
          <h2>📊 Activities</h2>
          {activities.map(a => (
            <div key={a.id} style={styles.card}>
              <b>{a.name}</b>
              <p>{a.value} / {a.target}</p>

              <button onClick={() => updateActivity(a.id, 1)}>+</button>
              <button onClick={() => updateActivity(a.id, -1)}>-</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  switch: { display: "flex", gap: 10, marginBottom: 10 },
  add: { display: "flex", gap: 10, marginBottom: 20 },
  card: {
    padding: 10,
    marginBottom: 10,
    background: "#0f172a",
    color: "white",
    borderRadius: 8
  }
};