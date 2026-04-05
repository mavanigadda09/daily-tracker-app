import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary";

// ✅ GLOBAL PROVIDERS
import { NotificationProvider } from "./context/NotificationContext";

const root = document.getElementById("root");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>

      {/* 🌍 GLOBAL CONTEXT */}
      <NotificationProvider>
        <App />
      </NotificationProvider>

    </ErrorBoundary>
  </StrictMode>
);