import { Link } from "react-router-dom";

export default function Layout({ children, user, onLogout }) {
  return (
    <div style={styles.container}>

      {/* NAVBAR */}
      <nav style={styles.nav}>
        <h2 style={styles.logo}>🚀 Tracker</h2>

        <div style={styles.links}>
          <Link to="/">Dashboard</Link>
          <Link to="/habits">Habits</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/activities">Activities</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/insights">Insights</Link>
        </div>

        <div>
          <span style={{ marginRight: 10 }}>
            {user?.name || "User"}
          </span>
          <button onClick={onLogout} style={styles.logout}>
            Logout
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <main style={styles.main}>
        {children}
      </main>

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "#fff"
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    borderBottom: "1px solid #1e293b"
  },

  logo: {
    margin: 0
  },

  links: {
    display: "flex",
    gap: 15
  },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    color: "#fff",
    cursor: "pointer"
  },

  main: {
    padding: 20
  }
};