import { useState } from "react";

export default function Profile({ user, setUser, onLogout }) {

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [goal, setGoal] = useState(user?.goal || "");
  const [focus, setFocus] = useState(user?.focus || "productivity");

  if (!user) return null;

  // ===== SAVE =====
  const handleSave = () => {
    const updated = {
      ...user,
      name,
      goal,
      focus
    };

    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
    setEditing(false);
  };

  // ===== RESET DATA =====
  const handleReset = () => {
    if (!confirm("Reset all app data?")) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>👤 Profile</h1>

      <div style={styles.card}>

        {/* AVATAR */}
        <div style={styles.avatar}>
          {name?.charAt(0).toUpperCase()}
        </div>

        {/* NAME */}
        {editing ? (
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <h2 style={styles.name}>{name}</h2>
        )}

        {/* EMAIL */}
        <p style={styles.email}>{user.email}</p>

        {/* GOAL */}
        {editing ? (
          <input
            style={styles.input}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Your goal"
          />
        ) : (
          <p style={styles.goal}>🎯 {goal || "No goal set"}</p>
        )}

        {/* FOCUS */}
        {editing && (
          <div style={styles.focusRow}>
            {["productivity", "fitness", "finance"].map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                style={{
                  ...styles.focusBtn,
                  ...(focus === f ? styles.focusActive : {})
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {!editing && (
          <p style={styles.meta}>
            Focus: <strong>{focus}</strong>
          </p>
        )}

        {/* ACTIONS */}
        <div style={styles.actions}>

          {editing ? (
            <>
              <button style={styles.saveBtn} onClick={handleSave}>
                Save
              </button>

              <button
                style={styles.cancelBtn}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                style={styles.editBtn}
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>

              <button style={styles.logoutBtn} onClick={onLogout}>
                Logout
              </button>

              <button style={styles.resetBtn} onClick={handleReset}>
                Reset App
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20
  },

  title: {
    fontSize: 28
  },

  card: {
    width: 360,
    background: "var(--card)",
    padding: 30,
    borderRadius: 16,
    border: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: "50%",
    background: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff"
  },

  name: {
    fontSize: 20
  },

  email: {
    color: "var(--text-muted)"
  },

  goal: {
    marginTop: 5
  },

  meta: {
    color: "var(--text-muted)",
    fontSize: 14
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    width: "100%"
  },

  focusRow: {
    display: "flex",
    gap: 8
  },

  focusBtn: {
    flex: 1,
    padding: 6,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    cursor: "pointer",
    color: "var(--text)"
  },

  focusActive: {
    background: "var(--accent)",
    color: "#fff"
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
    marginTop: 10
  },

  editBtn: {
    padding: 10,
    background: "#3b82f6",
    border: "none",
    color: "#fff",
    borderRadius: 8
  },

  saveBtn: {
    padding: 10,
    background: "#22c55e",
    border: "none",
    color: "#fff",
    borderRadius: 8
  },

  cancelBtn: {
    padding: 10,
    background: "#6b7280",
    border: "none",
    color: "#fff",
    borderRadius: 8
  },

  logoutBtn: {
    padding: 10,
    background: "#ef4444",
    border: "none",
    color: "#fff",
    borderRadius: 8
  },

  resetBtn: {
    padding: 10,
    background: "#111827",
    border: "1px solid var(--border)",
    color: "#fff",
    borderRadius: 8
  }
};