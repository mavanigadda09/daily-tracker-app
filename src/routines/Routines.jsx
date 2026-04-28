// src/features/routines/Routines.jsx
import { useRoutines } from "../hooks/useRoutines";

export default function Routines() {
  const {
    week,
    todayKey,
    routineStats,
    newRoutine,
    setNewRoutine,
    toggle,
    addRoutine,
    deleteRoutine,
  } = useRoutines();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addRoutine();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📅 Weekly Routines</h1>

      {/* ADD */}
      <div style={styles.addBox}>
        <input
          value={newRoutine}
          onChange={(e) => setNewRoutine(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add new routine..."
          style={styles.input}
        />
        <button onClick={addRoutine} style={styles.addBtn}>
          Add
        </button>
      </div>

      {routineStats.length === 0 && (
        <p style={styles.empty}>No routines yet — add one above 🚀</p>
      )}

      {/* TABLE */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={{ ...styles.th, textAlign: "left" }}>Routine</th>
              {week.map((d) => (
                <th
                  key={d.key}
                  style={{
                    ...styles.th,
                    color: d.key === todayKey ? "var(--accent)" : "inherit",
                  }}
                >
                  {d.label}
                  <br />
                  <small style={{ fontWeight: 400, opacity: 0.6 }}>
                    {d.date}
                  </small>
                </th>
              ))}
              <th style={styles.th}>%</th>
              <th style={styles.th}>Progress</th>
              <th style={styles.th}></th>
            </tr>
          </thead>

          <tbody>
            {routineStats.map((r, i) => (
              <tr key={r.id} style={styles.row}>
                <td style={styles.td}>{i + 1}</td>
                <td style={{ ...styles.td, ...styles.name }}>{r.name}</td>

                {week.map((d) => {
                  const checked = !!r.completed?.[d.key];
                  const isToday = d.key === todayKey;

                  return (
                    <td key={d.key} style={styles.td}>
                      <button
                        onClick={() => toggle(r.id, d.key)}
                        title={`${r.name} — ${d.label} ${d.date}`}
                        style={{
                          ...styles.cell,
                          background: checked
                            ? "var(--accent)"
                            : "var(--card-hover)",
                          color: checked ? "#020617" : "var(--text-muted)",
                          outline: isToday
                            ? "2px solid var(--accent)"
                            : "none",
                          outlineOffset: 2,
                        }}
                      >
                        {checked ? "✔" : ""}
                      </button>
                    </td>
                  );
                })}

                <td style={{ ...styles.td, fontWeight: 600 }}>
                  {r.percent}%
                </td>

                <td style={styles.td}>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${r.percent}%`,
                      }}
                    />
                  </div>
                </td>

                <td style={styles.td}>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${r.name}"?`)) {
                        deleteRoutine(r.id);
                      }
                    }}
                    style={styles.deleteBtn}
                    title="Delete routine"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  container: {
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    position: "relative",
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "var(--text)",
  },
  addBox: {
    display: "flex",
    gap: 10,
    maxWidth: 480,
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
  },
  addBtn: {
    padding: "10px 20px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "var(--accent)",
    color: "#020617",
    fontWeight: "bold",
    cursor: "pointer",
  },
  empty: {
    color: "var(--text-muted)",
    fontSize: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    padding: "8px 12px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontWeight: 600,
    fontSize: 12,
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    textAlign: "center",
    borderBottom: "1px solid var(--border)",
    color: "var(--text)",
    verticalAlign: "middle",
  },
  row: {
    transition: "background var(--transition)",
  },
  name: {
    textAlign: "left",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  cell: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "bold",
    transition: "background 0.2s, transform 0.1s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    width: 80,
    height: 6,
    background: "var(--border)",
    borderRadius: 10,
    overflow: "hidden",
    margin: "0 auto",
  },
  progressFill: {
    height: "100%",
    background: "var(--accent)",
    borderRadius: 10,
    transition: "width 0.3s ease",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: 14,
    padding: 4,
    borderRadius: 4,
    transition: "color 0.2s",
  },
};