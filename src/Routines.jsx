import { useState, useEffect } from "react";

// ================= DEFAULT ROUTINES =================
const DEFAULT_ROUTINES = [
  "Lift Weights",
  "Eat Healthy",
  "Drink 5L Water",
  "No Outside Food",
  "No Junk Food"
];

export default function Routines() {

  // ================= LOAD =================
  const [routines, setRoutines] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("routines"));

    if (stored && stored.length) return stored;

    return DEFAULT_ROUTINES.map((name, i) => ({
      id: Date.now() + i,
      name,
      completed: {}
    }));
  });

  const [newRoutine, setNewRoutine] = useState("");

  // ================= SAVE =================
  useEffect(() => {
    localStorage.setItem("routines", JSON.stringify(routines));
  }, [routines]);

  // ================= WEEK WITH DATE =================
  const getWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday

    const start = new Date(today);
    start.setDate(today.getDate() - day);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return {
        label: days[d.getDay()],
        date: d.getDate(),
        key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      };
    });
  };

  const week = getWeek();

  // ================= TOGGLE =================
  const toggle = (id, key) => {
    setRoutines((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        const updated = { ...(r.completed || {}) };
        updated[key] = !updated[key];

        return { ...r, completed: updated };
      })
    );
  };

  // ================= ADD =================
  const addRoutine = () => {
    if (!newRoutine.trim()) return;

    setRoutines([
      ...routines,
      {
        id: Date.now(),
        name: newRoutine.trim(),
        completed: {}
      }
    ]);

    setNewRoutine("");
  };

  // ================= DELETE =================
  const deleteRoutine = (id) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  // ================= PROGRESS =================
  const getPercent = (routine) => {
    const values = Object.values(routine.completed || {});
    const done = values.filter(Boolean).length;

    return Math.round((done / 7) * 100);
  };

  // ================= UI =================
  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Weekly Routines</h1>

      {/* ADD */}
      <div style={styles.addBox}>
        <input
          value={newRoutine}
          onChange={(e) => setNewRoutine(e.target.value)}
          placeholder="Add new routine"
          style={styles.input}
        />
        <button onClick={addRoutine} style={styles.addBtn}>
          Add
        </button>
      </div>

      {/* GRID */}
      <div style={styles.grid}>

        <div>#</div>
        <div>Routine</div>

        {week.map((d) => (
          <div key={d.key} style={styles.header}>
            {d.label}
            <br />
            <small>{d.date}</small>
          </div>
        ))}

        <div>%</div>
        <div>Progress</div>
        <div></div>

        {routines.map((r, i) => {
          const percent = getPercent(r);

          return (
            <div key={r.id} style={{ display: "contents" }}>

              <div>{i + 1}</div>

              <div style={styles.name}>{r.name}</div>

              {week.map((d) => {
                const checked = r.completed?.[d.key] || false;

                return (
                  <div
                    key={d.key}
                    onClick={() => toggle(r.id, d.key)}
                    style={{
                      ...styles.cell,
                      background: checked ? "#22c55e" : "#020617"
                    }}
                  >
                    {checked ? "✔" : ""}
                  </div>
                );
              })}

              <div>{percent}%</div>

              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${percent}%`
                  }}
                />
              </div>

              {/* DELETE BUTTON */}
              <button
                onClick={() => deleteRoutine(r.id)}
                style={styles.deleteBtn}
              >
                ✖
              </button>

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
    padding: 30,
    color: "#fff"
  },

  title: {
    fontSize: 26,
    marginBottom: 20
  },

  addBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff"
  },

  addBtn: {
    background: "#6366f1",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "40px 180px repeat(7, 45px) 50px 150px 40px",
    gap: 8,
    alignItems: "center"
  },

  header: {
    textAlign: "center",
    fontWeight: "bold"
  },

  name: {
    fontWeight: "bold"
  },

  cell: {
    width: 40,
    height: 40,
    border: "1px solid #1e293b",
    borderRadius: 6,
    cursor: "pointer",
    textAlign: "center",
    lineHeight: "40px"
  },

  progressBar: {
    height: 10,
    background: "#1e293b",
    borderRadius: 10,
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: "#22c55e"
  },

  deleteBtn: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
    height: 30
  }
};