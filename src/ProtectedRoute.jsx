import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, firebaseUser }) {

  // Loading state
  if (firebaseUser === undefined) {
    return <div style={{ color: "white", padding: 20 }}>Loading...</div>;
  }

  // Not logged in
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}