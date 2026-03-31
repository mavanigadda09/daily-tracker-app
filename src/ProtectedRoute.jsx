import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, user, firebaseUser }) {

  // 🔄 Still checking auth → show loading
  if (firebaseUser === undefined) {
    return (
      <div style={{
        color: "white",
        padding: 20,
        fontSize: 18
      }}>
        Loading...
      </div>
    );
  }

  // ❌ Not logged in → go to login page
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Logged in but no user profile → onboarding
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }

  // ✅ Everything OK
  return children;
}