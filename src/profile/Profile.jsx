import React from "react";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";
import { useProfileEditor } from "../hooks/useProfileEditor";

const FOCUS_OPTIONS = [
  { value: "productivity", label: "⚡ Productivity" },
  { value: "fitness",      label: "🏋️ Fitness"      },
  { value: "finance",      label: "💰 Finance"       },
];

export default function Profile() {
  const { user, updateUser } = useAppData();
  const { logout } = useAuth();

  const {
    editing, name, goal, focus,
    isSaving, saveError, saveSuccess,
    setName, setGoal, setFocus,
    handleEdit, handleCancel, handleSave, handleReset,
  } = useProfileEditor(user, updateUser);

  if (!user) {
    return (
      <div style={styles.container}>
        <p style={{ color: "var(--accent)" }}>Synchronizing Phoenix Profile...</p>
      </div>
    );
  }

  const avatarLetter = name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👤 Profile</h1>

      <div className="glass-panel" style={styles.card}>

        {/* AVATAR */}
        <div style={styles.avatar}>{avatarLetter}</div>

        {/* NAME */}
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

        {/* EMAIL */}
        <p style={styles.email}>{user.email || "No email linked"}</p>

        {/* GOAL */}
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

        {/* FOCUS PICKER */}
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
            <strong style={{ color: "var(--accent)" }}>
              {FOCUS_OPTIONS.find((f) => f.value === focus)?.label || focus}
            </strong>
          </p>
        )}

        {/* FEEDBACK */}
        {saveError && <p style={styles.error}>{saveError}</p>}
        {saveSuccess && <p style={styles.success}>✓ Profile saved</p>}

        {/* ACTIONS */}
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

        {/* DANGER ZONE */}
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
    color: "#fff",
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
  name:  { fontSize: 24, margin: 0, fontWeight: "600" },
  email: { color: "var(--text-muted)", fontSize: 14, margin: 0 },
  goal:  { fontSize: 16, textAlign: "center", color: "#fff" },
  meta:  { color: "var(--text-muted)", fontSize: 13 },
  label: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    letterSpacing: "1px",
    marginBottom: 5,
    display: "block",
  },
  input: {
    padding: "12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "rgba(0,0,0,0.2)",
    color: "var(--text)",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: 15,
  },
  focusRow: { display: "flex", gap: 8, width: "100%" },
  focusBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    cursor: "pointer",
    color: "var(--text-muted)",
    fontSize: 12,
    transition: "0.2s",
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
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
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
  },
  cancelBtn: {
    padding: 12,
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    borderRadius: 8,
    cursor: "pointer",
  },
  logoutBtn: {
    padding: 12,
    background: "#ef4444",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
  },
  dangerZone: {
    width: "100%",
    marginTop: 10,
    paddingTop: 16,
    borderTop: "1px solid rgba(239,68,68,0.2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  dangerLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#ef444466",
    margin: 0,
  },
  resetBtn: {
    padding: "8px 16px",
    background: "transparent",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#ef4444",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
  },
  error:   { color: "#ef4444", fontSize: 13, margin: 0 },
  success: { color: "#22c55e", fontSize: 13, margin: 0 },
};