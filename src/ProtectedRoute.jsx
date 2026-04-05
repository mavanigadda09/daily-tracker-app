import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, firebaseUser }) {

  const location = useLocation();

  // ===== LOADING =====
  if (firebaseUser === undefined) {
    return (
      <div style={styles.loader}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // ===== NOT AUTHENTICATED =====
  if (!firebaseUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

// ================= STYLES =================
const styles = {
  loader: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    color: "var(--text)"
  },

  spinner: {
    width: 30,
    height: 30,
    border: "3px solid var(--border)",
    borderTop: "3px solid var(--accent)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};