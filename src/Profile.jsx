export default function Profile({ user }) {
  if (!user) return null;

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <h1 style={styles.title}>Profile</h1>
      <p style={styles.subtitle}>Manage your account</p>

      {/* CARD */}
      <div style={styles.card}>

        {/* AVATAR */}
        <div style={styles.avatar}>
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>

        {/* NAME */}
        <h2 style={styles.name}>{user.name || "User"}</h2>

        {/* EMAIL */}
        <p style={styles.email}>{user.email}</p>

        {/* INFO */}
        <div style={styles.infoBox}>
          <div style={styles.infoItem}>
            <span>Status</span>
            <strong>Active</strong>
          </div>

          <div style={styles.infoItem}>
            <span>Account</span>
            <strong>Firebase</strong>
          </div>

          <div style={styles.infoItem}>
            <span>Plan</span>
            <strong>Free</strong>
          </div>
        </div>

      </div>

    </div>
  );
}

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

  subtitle: {
    color: "var(--text-muted)"
  },

  card: {
    width: 340,
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
    color: "#fff",
    marginBottom: 10
  },

  name: {
    fontSize: 20
  },

  email: {
    color: "var(--text-muted)",
    marginBottom: 10
  },

  infoBox: {
    width: "100%",
    marginTop: 10,
    borderTop: "1px solid var(--border)",
    paddingTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: "var(--text-muted)"
  }
};