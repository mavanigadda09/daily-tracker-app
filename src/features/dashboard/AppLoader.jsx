export default function AppLoader() {
  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.text}>Loading Phoenix Tracker...</p>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "var(--bg)",
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid var(--border)",
    borderTop: "3px solid var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  text: {
    color: "var(--text-muted)",
    fontSize: 14,
  },
};