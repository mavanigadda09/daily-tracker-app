import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary"; // ✅ NEW

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary> {/* ✅ WRAP APP */}
      <App />
    </ErrorBoundary>
  </StrictMode>
);

