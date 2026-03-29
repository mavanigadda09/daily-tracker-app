export default function Profile({ user }) {
  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.avatar}>
          👤
        </div>

        <h2>{user.name || "User"}</h2>
        <p style={styles.email}>{user.email}</p>

        <div style={styles.info}>
          <p>Status: Active</p>
          <p>Account: Firebase Connected</p>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: 40
  },

  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 16,
    boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
    textAlign: "center",
    width: 320
  },

  avatar: {
    fontSize: 60,
    marginBottom: 10
  },

  email: {
    color: "#6b7280",
    marginBottom: 20
  },

  info: {
    fontSize: 14,
    color: "#374151"
  }
};