// src/features/setup/Setup.jsx
import { useSetupForm } from "../../hooks/useSetupForm";

/**
 * Setup — pure UI shell.
 * addActivity + activities come from useAppData in the parent.
 */
export default function Setup({ addActivity, activities = [] }) {
  const {
    form, set,
    applySuggestion,
    isValid, error,
    handleSave,
    SUGGESTED, UNITS, FREQUENCIES,
  } = useSetupForm(activities, addActivity);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚙ Setup Activity</h1>

      <div className="glass-panel" style={styles.card}>

        {/* FORM GRID */}
        <div style={styles.grid}>

          {/* NAME — datalist for suggestions */}
          <div style={styles.fieldFull}>
            <label style={styles.label}>Activity Name</label>
            <input
              list="activity-suggestions"
              value={form.name}
              onChange={(e) => applySuggestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Water, Workout..."
              style={styles.input}
            />
            <datalist id="activity-suggestions">
              {SUGGESTED.map((s) => (
                <option key={s.name} value={s.name} />
              ))}
            </datalist>
          </div>

          {/* TARGET */}
          <div style={styles.field}>
            <label style={styles.label}>Target</label>
            <input
              type="number"
              min="1"
              style={styles.input}
              placeholder="e.g. 5"
              value={form.target}
              onChange={(e) => set("target", e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* UNIT */}
          <div style={styles.field}>
            <label style={styles.label}>Unit</label>
            <select
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              style={styles.input}
            >
              {UNITS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* REMINDER */}
          <div style={styles.field}>
            <label style={styles.label}>Reminder Time</label>
            <input
              type="time"
              style={styles.input}
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </div>

          {/* FREQUENCY */}
          <div style={styles.field}>
            <label style={styles.label}>Frequency</label>
            <select
              value={form.freq}
              onChange={(e) => set("freq", e.target.value)}
              style={styles.input}
            >
              {FREQUENCIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* ERROR */}
        {error && <p style={styles.error}>{error}</p>}

        {/* SAVE */}
        <button
          style={{
            ...styles.btn,
            opacity: isValid ? 1 : 0.5,
            cursor: isValid ? "pointer" : "not-allowed",
          }}
          onClick={handleSave}
          disabled={!isValid}
        >
          Save Activity
        </button>

        {/* PREVIEW LIST */}
        {activities.length > 0 && (
          <div style={styles.preview}>
            <p style={styles.previewTitle}>Your Activities</p>
            {activities.map((a) => (
              <div key={a.id} style={styles.previewCard}>
                <div>
                  <strong style={{ color: "var(--text)" }}>{a.name}</strong>
                  <span style={styles.previewMeta}>
                    {" "}— {a.target} {a.unit} · {a.frequency}
                    {a.reminderTime && ` · ⏰ ${a.reminderTime}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Styles — all CSS variables, no hardcoded colors ─────────────────────────

const styles = {
  container: {
    width: "100%",
    maxWidth: 640,
    margin: "0 auto",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "var(--text)",
  },
  card: {
    padding: 30,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
    marginBottom: 4,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  fieldFull: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    gridColumn: "1 / -1", // spans full width
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    color: "var(--text-muted)",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "var(--card)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    marginTop: 20,
    width: "100%",
    background: "var(--accent)",
    color: "#020617",
    padding: 14,
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontWeight: "bold",
    fontSize: 15,
    transition: "opacity var(--transition)",
  },
  error: {
    color: "var(--danger)",
    fontSize: 13,
    marginTop: 10,
  },
  preview: {
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  previewTitle: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "var(--text-muted)",
    marginBottom: 4,
  },
  previewCard: {
    padding: "10px 14px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
  },
  previewMeta: {
    color: "var(--text-muted)",
    fontSize: 13,
  },
};