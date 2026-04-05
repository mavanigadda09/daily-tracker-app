import { useState, useEffect, useMemo } from "react";

const DEFAULT_ROUTINES = [
  "Lift Weights",
  "Eat Healthy",
  "Drink 5L Water",
  "No Outside Food",
  "No Junk Food"
];

export default function Routines() {

  const [routines, setRoutines] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("routines"));
    if (stored?.length) return stored;

    return DEFAULT_ROUTINES.map((name) => ({
      id: crypto.randomUUID(),
      name,
      completed: {}
    }));
  });

  const [newRoutine, setNewRoutine] = useState("");

  useEffect(() => {
    localStorage.setItem("routines", JSON.stringify(routines));
  }, [routines]);

  // ===== WEEK (MEMO) =====
  const week = useMemo(() => {
    const today = new Date();
    const day = today.getDay();

    const start = new Date(today);
    start.setDate(today.getDate() - day);

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return {
        label: days[d.getDay()],
        date: d.getDate(),
        key: `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
      };
    });
  }, []);

  // ===== TOGGLE =====
  const toggle = (id, key) => {
    setRoutines(prev =>
      prev.map(r => {
        if (r.id !== id) return r;

        return {
          ...r,
          completed: {
            ...r.completed,
            [key]: !r.completed?.[key]
          }
        };
      })
    );
  };

  // ===== ADD =====
  const addRoutine = () => {
    if (!newRoutine.trim()) return;

    setRoutines(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newRoutine.trim(),
        completed: {}
      }
    ]);

    setNewRoutine("");
  };

  const deleteRoutine = (id) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  // ===== PERCENT (MEMOIZED MAP) =====
  const routineStats = useMemo(() => {
    return routines.map(r => {
      const values = Object.values(r.completed || {});
      const done = values.filter(Boolean).length;
      const percent = Math.round((done / 7) * 100);

      return { ...r, percent };
    });
  }, [routines]);

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>📅 Weekly Routines</h1>

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

      {routineStats.length === 0 && (
        <p style={styles.empty}>No routines yet 🚀</p>
      )}

      {/* GRID */}
      <div style={{ overflowX: "auto" }}>
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

          {routineStats.map((r, i) => (
            <div key={r.id} style={{ display: "contents" }}>

              <div>{i + 1}</div>

              <div style={styles.name}>{r.name}</div>

              {week.map((d) => {
                const checked = r.completed?.[d.key];

                return (
                  <div
                    key={d.key}
                    onClick={() => toggle(r.id, d.key)}
                    style={{
                      ...styles.cell,
                      background: checked ? "#16a34a" : "#f3f4f6"
                    }}
                  >
                    {checked ? "✔" : ""}
                  </div>
                );
              })}

              <div>{r.percent}%</div>

              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${r.percent}%`
                  }}
                />
              </div>

              <button
                onClick={() => deleteRoutine(r.id)}
                style={styles.deleteBtn}
              >
                ✖
              </button>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}