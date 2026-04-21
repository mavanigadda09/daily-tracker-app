import { useRoutines } from "../../hooks/useRoutines";

export default function Routines() {
  const {
    week, todayKey, routineStats,
    newRoutine, setNewRoutine,
    toggle, addRoutine, deleteRoutine,
  } = useRoutines();

  const handleKeyDown = (e) => { if (e.key === "Enter") addRoutine(); };

  return (
    <div style={s.container}>
      <div style={s.pageHeader}>
        <h1 style={s.title}>Weekly Routines</h1>
        <p style={s.subtitle}>
          {routineStats.length} routine{routineStats.length !== 1 ? "s" : ""} tracked
        </p>
      </div>

      {/* ADD */}
      <div style={s.addBox}>
        <input
          value={newRoutine}
          onChange={(e) => setNewRoutine(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add new routine…"
          style={s.input}
        />
        <button onClick={addRoutine} style={s.addBtn}>Add routine</button>
      </div>

      {/* EMPTY STATE */}
      {routineStats.length === 0 && (
        <div style={s.emptyState}>
          <span style={s.emptyIcon}>📅</span>
          <p style={s.emptyTitle}>No routines yet</p>
          <p style={s.emptySubtitle}>Add a routine above and track it across the week</p>
        </div>
      )}

      {/* TABLE */}
      {routineStats.length > 0 && (
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={{ ...s.th, textAlign: "left" }}>Routine</th>
                {week.map((d) => (
                  <th key={d.key} style={{
                    ...s.th,
                    color: d.key === todayKey
                      ? "var(--color-text-info)"
                      : "var(--color-text-tertiary)",
                  }}>
                    {d.label}
                    <br />
                    <small style={{ fontWeight: 400, opacity: 0.6 }}>{d.date}</small>
                  </th>
                ))}
                <th style={s.th}>%</th>
                <th style={s.th}>Progress</th>
                <th style={s.th} />
              </tr>
            </thead>
            <tbody>
              {routineStats.map((r, i) => (
                <tr key={r.id} style={s.row}>
                  <td style={s.td}>{i + 1}</td>
                  <td style={{ ...s.td, ...s.name }}>{r.name}</td>

                  {week.map((d) => {
                    const checked = !!r.completed?.[d.key];
                    const isToday = d.key === todayKey;
                    return (
                      <td key={d.key} style={s.td}>
                        <button
                          onClick={() => toggle(r.id, d.key)}
                          title={`${r.name} — ${d.label} ${d.date}`}
                          style={{
                            ...s.cell,
                            background: checked
                              ? "var(--color-text-info)"
                              : "var(--color-background-tertiary)",
                            color: checked
                              ? "var(--color-background-primary)"
                              : "var(--color-text-tertiary)",
                            outline: isToday
                              ? "2px solid var(--color-border-info)"
                              : "none",
                            outlineOffset: 2,
                          }}
                        >
                          {checked ? "✔" : ""}
                        </button>
                      </td>
                    );
                  })}

                  <td style={{ ...s.td, fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {r.percent}%
                  </td>

                  <td style={s.td}>
                    <div style={s.progressBar}>
                      <div style={{
                        ...s.progressFill,
                        width: `${r.percent}%`,
                        background: r.percent === 100
                          ? "var(--color-text-success)"
                          : "var(--color-text-info)",
                      }} />
                    </div>
                  </td>

                  <td style={s.td}>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${r.name}"?`)) deleteRoutine(r.id);
                      }}
                      style={s.deleteBtn}
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
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = {
  container: {
    padding: "20px 20px 40px",
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    color: "var(--color-text-primary)",
  },
  pageHeader: { display: "flex", flexDirection: "column", gap: 4 },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: 13,
    color: "var(--color-text-tertiary)",
    margin: 0,
  },
  addBox: {
    display: "flex",
    gap: 10,
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: 12,
  },
  input: {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
  },
  addBtn: {
    padding: "9px 18px",
    borderRadius: 8,
    border: "none",
    background: "var(--color-background-success)",
    color: "var(--color-text-success)",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "48px 20px",
    background: "var(--color-background-secondary)",
    border: "1px dashed var(--color-border-secondary)",
    borderRadius: 16,
    textAlign: "center",
  },
  emptyIcon: { fontSize: 32, opacity: 0.5 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
    color: "var(--color-text-secondary)",
  },
  emptySubtitle: {
    fontSize: 13,
    margin: 0,
    color: "var(--color-text-tertiary)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    background: "var(--color-background-secondary)",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid var(--color-border-tertiary)",
  },
  th: {
    padding: "10px 12px",
    textAlign: "center",
    color: "var(--color-text-tertiary)",
    fontWeight: 600,
    fontSize: 12,
    borderBottom: "1px solid var(--color-border-tertiary)",
    whiteSpace: "nowrap",
    background: "var(--color-background-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "10px 12px",
    textAlign: "center",
    borderBottom: "1px solid var(--color-border-tertiary)",
    color: "var(--color-text-primary)",
    verticalAlign: "middle",
  },
  row: {
    transition: "background 0.15s",
  },
  name: {
    textAlign: "left",
    fontWeight: 500,
    whiteSpace: "nowrap",
    color: "var(--color-text-primary)",
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
    background: "var(--color-background-tertiary)",
    borderRadius: 10,
    overflow: "hidden",
    margin: "0 auto",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
    transition: "width 0.3s ease",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "var(--color-text-tertiary)",
    cursor: "pointer",
    fontSize: 14,
    padding: 4,
    borderRadius: 4,
  },
};