import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, user, firebaseUser }) {

  // ❌ Not logged in → go to login
  if (!firebaseUser) {
    return <Navigate to="/" replace />;
  }

  // ❌ No local user (onboarding incomplete)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}