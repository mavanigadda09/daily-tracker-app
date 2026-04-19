import { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { NotificationProvider } from "./context/NotificationContext";
import { DataProvider } from "./context/DataContext";

import { useAuth } from "./hooks/useAuth";
import { useAppData } from "./hooks/useAppData";
import { useTheme } from "./hooks/useTheme";
import { useReminderSystems } from "./hooks/useReminderSystems";

import mapToDashboardData from "./features/dashboard/dashboardAdapter";
import {
  PROTECTED_ROUTES,
  dashboardElement,
} from "./features/dashboard/routes";
import { AppLoader } from "./features/dashboard/AppLoader";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";

// ─── Error Boundary (NEW - Safety Layer) ──────────────────────
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the app.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Shell ────────────────────────────────────────────────────
function AppInner() {
  const [theme, setTheme] = useTheme();
  const { firebaseUser, isResolvingAuth, user, login, logout } =
    useAuth();

  const appData = useAppData(firebaseUser);

  // Only run reminders AFTER data is ready
  if (!appData.loading) {
    useReminderSystems({
      items: appData.items,
      tasks: appData.tasks,
      logs: appData.logs,
    });
  }

  // Stable memo (prevents unnecessary recompute)
  const dashboardData = useMemo(
    () =>
      mapToDashboardData({
        tasks: appData.tasks,
        items: appData.items,
        weightLogs: appData.weightLogs,
      }),
    [appData] // ✅ more stable dependency
  );

  // Block render until ready
  if (isResolvingAuth || appData.loading) {
    return <AppLoader />;
  }

  return (
    <DataProvider value={appData}>
      <Routes>
        {/* ── Public ───────────────────────── */}
        <Route
          path="/login"
          element={<Login onLogin={login} />}
        />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ── Protected ────────────────────── */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout
                user={user}
                onLogout={logout}
                theme={theme}
                setTheme={setTheme}
              />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={dashboardElement(dashboardData, user)}
          />

          {PROTECTED_ROUTES.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={element(appData, user)}
            />
          ))}
        </Route>

        {/* ── Fallback (Improved) ──────────── */}
        <Route
          path="*"
          element={
            <Navigate
              to={firebaseUser ? "/" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </DataProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────
export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </BrowserRouter>
    </NotificationProvider>
  );
}