import React, { useEffect, useState } from "react";

export default function Profile({ user, setUser, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [focus, setFocus] = useState("productivity");

  // ✅ SYNC WITH APP USER
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setGoal(user.goal || "");
      setFocus(user.focus || "productivity");
    }
  }, [user]);

  // ✅ PHOENIX LOADING STATE
  if (!user) {
    return (
      <div style={styles.container}>
        <h2 style={{ color: "var(--accent)" }}>Synchronizing Phoenix Profile...</h2>
      </div>
    );
  }

  // ===== SAVE HANDLER =====
  const handleSave = () => {
    const updated = {
      ...user,
      name,
      goal,
      focus
    };

    // Update Global State
    if (setUser) {
      setUser(updated);
    }

    // Update Persistence
    localStorage.setItem("user", JSON.stringify(updated));
    setEditing(false);
  };

  // ===== RESET APP DATA =====
  const handleReset = () => {
    if (!window.confirm("Reset all app data? This cannot be undone.")) return;
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👤 Profile</h1>

      <div className="glass-panel" style={styles.card}>
        
        {/* PHOENIX AVATAR */}
        <div style={styles.avatar}>
          {name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        {/* NAME SECTION */}
        {editing ? (
          <div style={{ width: '100%' }}>
            <label style={styles.label}>Display Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />
          </div>
        ) : (
          <h2 style={styles.name}>{name || "User"}</h2>
        )}

        {/* EMAIL (Read Only) */}
        <p style={styles.email}>{user.email || "No email linked"}</p>

        {/* GOAL SECTION */}
        {editing ? (
          <div style={{ width: '100%' }}>
            <label style={styles.label}>Your Phoenix Goal</label>
            <input
              style={styles.input}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Set a new goal"
            />
          </div>
        ) : (
          <p style={styles.goal}>🎯 {goal || "No goal set yet"}</p>
        )}

        {/* FOCUS PICKER */}
        {editing && (
          <div style={{ width: '100%' }}>
            <label style={styles.label}>Current Focus</label>
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
          </div>
        )}

        {!editing && (
          <p style={styles.meta}>
            Current Focus: <strong style={{color: 'var(--accent)'}}>{focus.toUpperCase()}</strong>
          </p>
        )}

        {/* PHOENIX ACTION BUTTONS */}
        <div style={styles.actions}>
          {editing ? (
            <>
              <button style={styles.saveBtn} onClick={handleSave}>
                Save Changes
              </button>
              <button style={styles.cancelBtn} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button style={styles.editBtn} onClick={() => setEditing(true)}>
                Edit Profile
              </button>
              <button style={styles.logoutBtn} onClick={onLogout}>
                Logout Session
              </button>
              <button style={styles.resetBtn} onClick={handleReset}>
                Hard Reset App
              </button>
            </>
          )}
        </div>
      </div>
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
    zIndex: 1,
    position: 'relative'
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff"
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
    marginBottom: 10
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    marginBottom: 5,
    display: 'block'
  },
  name: { fontSize: 24, margin: 0, fontWeight: "600" },
  email: { color: "var(--text-muted)", fontSize: 14, margin: 0 },
  goal: { fontSize: 16, textAlign: 'center', color: '#fff' },
  meta: { color: "var(--text-muted)", fontSize: 13 },
  input: {
    padding: "12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "rgba(0,0,0,0.2)",
    color: "var(--text)",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: 15
  },
  focusRow: { display: "flex", gap: 8, width: '100%' },
  focusBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    cursor: "pointer",
    color: "var(--text-muted)",
    fontSize: 12,
    transition: '0.2s'
  },
  focusActive: {
    background: "var(--accent)",
    color: "#020617",
    borderColor: "var(--accent)",
    fontWeight: 'bold'
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "100%",
    marginTop: 20
  },
  editBtn: {
    padding: 12,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold"
  },
  saveBtn: {
    padding: 12,
    background: "var(--accent-orange)",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold"
  },
  cancelBtn: {
    padding: 12,
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    borderRadius: 8,
    cursor: "pointer"
  },
  logoutBtn: {
    padding: 12,
    background: "#ef4444",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer"
  },
  resetBtn: {
    padding: 10,
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: 12,
    cursor: "pointer",
    textDecoration: 'underline'
  }
};