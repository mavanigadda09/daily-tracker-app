import React from "react";
import { useDataContext } from "../context/DataContext";
import { useAuth } from "../hooks/useAuth";
import { useProfileEditor } from "../hooks/useProfileEditor";

const FOCUS_OPTIONS = [
  { value: "productivity", label: "⚡ Productivity" },
  { value: "fitness",      label: "🏋️ Fitness"      },
  { value: "finance",      label: "💰 Finance"       },
];

// Safely extract a plain string from a field that might be a
// Firestore Timestamp, undefined, null, or an actual string.
function safeStr(val, fallback = "") {
  if (typeof val === "string") return val;
  return fallback;
}

export default function Profile() {
  const { user, updateUser } = useDataContext();
  const { logout } = useAuth();

  // Compose a plain-object user so useProfileEditor never sees Timestamps
  const safeUser = user ? {
    ...user,
    name:  safeStr(user.name),
    email: safeStr(user.email),
    goal:  safeStr(user.goal),
    focus: safeStr(user.focus, "productivity"),
  } : null;

  const {
    editing, name, goal, focus,
    isSaving, saveError, saveSuccess,
    setName, setGoal, setFocus,
    handleEdit, handleCancel, handleSave, handleReset,
  } = useProfileEditor(safeUser, updateUser);

  if (!safeUser) {
    return (
      <div style={styles.container}>
        <p style={{ color: "var(--color-text-info)" }}>
          Synchronizing Phoenix Profile...
        </p>
      </div>
    );
  }

  const avatarLetter = name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Profile</h1>

      <div className="glass-panel" style={styles.card}>

        <div style={styles.avatar}>{avatarLetter}</div>

        {editing ? (
          <Field label="Display Name">
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              autoFocus
              disabled={isSaving}
            />
          </Field>
        ) : (
          <h2 style={styles.name}>{name || "User"}</h2>
        )}

        <p style={styles.email}>{safeUser.email || "No email linked"}</p>

        {editing ? (
          <Field label="Your Phoenix Goal">
            <input
              style={styles.input}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What are you working toward?"
              disabled={isSaving}
            />
          </Field>
        ) : (
          <p style={styles.goal}>🎯 {goal || "No goal set yet"}</p>
        )}

        {editing ? (
          <Field label="Current Focus">
            <div style={styles.focusRow}>
              {FOCUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFocus(value)}
                  disabled={isSaving}
                  style={{
                    ...styles.focusBtn,
                    ...(focus === value ? styles.focusActive : {}),
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        ) : (
          <p style={styles.meta}>
            Focus:{" "}
            <strong style={{ color: "var(--color-text-info)" }}>
              {FOCUS_OPTIONS.find((f) => f.value === focus)?.label || focus || "Not set"}
            </strong>
          </p>
        )}

        {saveError   && <p style={styles.error}>{saveError}</p>}
        {saveSuccess && <p style={styles.success}>✓ Profile saved</p>}

        <div style={styles.actions}>
          {editing ? (
            <>
              <button
                style={{ ...styles.saveBtn, opacity: isSaving ? 0.6 : 1 }}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                style={styles.cancelBtn}
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button style={styles.editBtn} onClick={handleEdit}>
                Edit Profile
              </button>
              <button style={styles.logoutBtn} onClick={logout}>
                Logout Session
              </button>
            </>
          )}
        </div>

        <div style={styles.dangerZone}>
          <p style={styles.dangerLabel}>Danger Zone</p>
          <button
            style={styles.resetBtn}
            onClick={() => handleReset(logout)}
          >
            Clear Local Data & Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ width: "100%" }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    position: "relative",
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "var(--color-text-primary)",
    margin: 0,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    padding: 30,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--accent), var(--accent-orange))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "#020617",
    boxShadow: "0 0 20px rgba(250, 204, 21, 0.3)",
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    margin: 0,
    fontWeight: 600,
    color: "var(--color-text-primary)",
  },
  email: {
    color: "var(--color-text-secondary)",
    fontSize: 14,
    margin: 0,
  },
  goal: {
    fontSize: 16,
    textAlign: "center",
    color: "var(--color-text-primary)",
    margin: 0,
  },
  meta: {
    color: "var(--color-text-secondary)",
    fontSize: 13,
    margin: 0,
  },
  label: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "var(--color-text-tertiary)",
    letterSpacing: "1px",
    marginBottom: 5,
    display: "block",
  },
  input: {
    padding: "12px",
    borderRadius: 8,
    border: "1px solid var(--color-border-secondary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: 15,
    fontSize: 14,
    outline: "none",
  },
  focusRow: {
    display: "flex",
    gap: 8,
    width: "100%",
  },
  focusBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid var(--color-border-secondary)",
    background: "transparent",
    cursor: "pointer",
    color: "var(--color-text-secondary)",
    fontSize: 12,
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  focusActive: {
    background: "var(--accent)",
    color: "#020617",
    borderColor: "var(--accent)",
    fontWeight: "bold",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "100%",
    marginTop: 20,
  },
  editBtn: {
    padding: 12,
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-text-info)",
    color: "var(--color-text-info)",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "inherit",
  },
  saveBtn: {
    padding: 12,
    background: "var(--accent-orange)",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    transition: "opacity 0.2s",
    fontSize: 14,
    fontFamily: "inherit",
  },
  cancelBtn: {
    padding: 12,
    background: "transparent",
    border: "1px solid var(--color-border-secondary)",
    color: "var(--color-text-secondary)",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
  },
  logoutBtn: {
    padding: 12,
    background: "#ef4444",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
  },
  dangerZone: {
    width: "100%",
    marginTop: 10,
    paddingTop: 16,
    borderTop: "1px solid var(--color-border-danger)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  dangerLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "var(--color-text-danger)",
    opacity: 0.5,
    margin: 0,
  },
  resetBtn: {
    padding: "8px 16px",
    background: "transparent",
    border: "1px solid var(--color-border-danger)",
    color: "var(--color-text-danger)",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  error:   { color: "var(--color-text-danger)",  fontSize: 13, margin: 0 },
  success: { color: "var(--color-text-success)", fontSize: 13, margin: 0 },
};