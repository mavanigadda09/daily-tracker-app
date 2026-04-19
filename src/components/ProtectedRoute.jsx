// src/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute — auth gate for all private routes.
 *
 * Reads auth state from useAuth() directly — no props needed.
 * Three states:
 *   undefined → still resolving Firebase session (show loader)
 *   null      → not authenticated (redirect to login)
 *   user obj  → authenticated (render children)
 *
 * Extension point: add `requireOnboarding` prop when that flow matures.
 */
export default function ProtectedRoute({ children }) {
  const { firebaseUser, isResolvingAuth } = useAuth();
  const location = useLocation();

  // Firebase session still resolving — avoid flash redirect to /login
  if (isResolvingAuth) {
    return <AuthLoader />;
  }

  // Not authenticated — send to login, preserve intended destination
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

/**
 * AuthLoader — shown only during Firebase session resolution.
 * Kept separate so it can be swapped for a skeleton/splash later.
 * Uses CSS class for @keyframes — inline styles can't animate.
 */
function AuthLoader() {
  return (
    <div style={styles.loader}>
      <div className="phoenix-spinner" style={styles.spinner} />
      <p style={styles.loaderText}>Authenticating...</p>
    </div>
  );
}

const styles = {
  loader: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    color: "var(--text)",
    background: "var(--bg)",
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid var(--border)",
    borderTopColor: "var(--accent)",
    // Animation defined in index.css — inline styles can't do @keyframes
  },
  loaderText: {
    fontSize: 14,
    color: "var(--text-muted)",
    margin: 0,
  },
};