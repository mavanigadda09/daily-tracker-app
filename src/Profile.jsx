import { useEffect, useState } from "react";

export default function Profile({ user, setUser, onLogout }) {

  const [editing, setEditing] = useState(false);
  const [localUser, setLocalUser] = useState(null);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [focus, setFocus] = useState("productivity");

  // ✅ FIX: Ensure user always exists
  useEffect(() => {
    let stored = localStorage.getItem("user");

    if (!stored) {
      // 🔥 CREATE DEFAULT USER
      const defaultUser = {
        name: "User",
        email: "user@email.com",
        goal: "",
        focus: "productivity"
      };

      localStorage.setItem("user", JSON.stringify(defaultUser));
      setLocalUser(defaultUser);
      setUser && setUser(defaultUser);
    } else {
      const parsed = JSON.parse(stored);
      setLocalUser(parsed);
      setUser && setUser(parsed);
    }
  }, []);

  // Sync form
  useEffect(() => {
    if (localUser) {
      setName(localUser.name || "");
      setGoal(localUser.goal || "");
      setFocus(localUser.focus || "productivity");
    }
  }, [localUser]);

  if (!localUser) {
    return (
      <div style={styles.container}>
        <h2>Loading profile...</h2>
      </div>
    );
  }

  // SAVE
  const handleSave = () => {
    const updated = {
      ...localUser,
      name,
      goal,
      focus
    };

    localStorage.setItem("user", JSON.stringify(updated));
    setLocalUser(updated);
    setUser && setUser(updated);
    setEditing(false);
  };

  // RESET
  const handleReset = () => {
    if (!window.confirm("Reset all app data?")) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>👤 Profile</h1>

      <div style={styles.card}>

        <div style={styles.avatar}>
          {name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        {editing ? (
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <h2 style={styles.name}>{name}</h2>
        )}

        <p style={styles.email}>{localUser.email}</p>

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

        <div style={styles.actions}>
          {editing ? (
            <>
              <button style={styles.saveBtn} onClick={handleSave}>
                Save
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

/* styles unchanged */
const styles = {
  container: { padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 },
  title: { fontSize: 28 },
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
  name: { fontSize: 20 },
  email: { color: "var(--text-muted)" },
  goal: { marginTop: 5 },
  meta: { color: "var(--text-muted)", fontSize: 14 },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    width: "100%"
  },
  focusRow: { display: "flex", gap: 8 },
  focusBtn: {
    flex: 1,
    padding: 6,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    cursor: "pointer",
    color: "var(--text)"
  },
  focusActive: { background: "var(--accent)", color: "#fff" },
  actions: { display: "flex", flexDirection: "column", gap: 8, width: "100%", marginTop: 10 },
  editBtn: { padding: 10, background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8 },
  saveBtn: { padding: 10, background: "#22c55e", border: "none", color: "#fff", borderRadius: 8 },
  cancelBtn: { padding: 10, background: "#6b7280", border: "none", color: "#fff", borderRadius: 8 },
  logoutBtn: { padding: 10, background: "#ef4444", border: "none", color: "#fff", borderRadius: 8 },
  resetBtn: { padding: 10, background: "#111827", border: "1px solid var(--border)", color: "#fff", borderRadius: 8 }
};