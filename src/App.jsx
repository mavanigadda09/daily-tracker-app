import { useMemo } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider }         from "./context/DataContext";
import { NotificationProvider } from "./context/NotificationContext";

import { useTheme }           from "./hooks/useTheme";
import { useAuth }            from "./hooks/useAuth";
import { useAppData }         from "./hooks/useAppData";
import { useReminderSystems } from "./hooks/useReminderSystems";

import ErrorBoundary  from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout         from "./components/Layout";
import AppLoader      from "./features/dashboard/AppLoader";

import Login      from "./pages/Login";
import Onboarding from "./pages/Onboarding";

import mapToDashboardData from "./features/dashboard/dashboardAdapter";
import { PROTECTED_ROUTES, dashboardElement } from "./features/dashboard/routes";

function PhoenixWatermark() {
  return (
    <div
      aria-hidden="true"
      style={{
        position:           "fixed",
        inset:              0,
        backgroundImage:    "url('/phoenix.png')",
        backgroundRepeat:   "no-repeat",
        backgroundPosition: "center",
        backgroundSize:     "contain",
        opacity:            0.03,
        pointerEvents:      "none",
        zIndex:             0,
        filter:             "grayscale(100%) brightness(1.2)",
      }}
    />
  );
}

function AppInner() {
  const [theme, toggleTheme] = useTheme();

  // ✅ FIX: removed non-existent "login" and "updateUser"
  const { firebaseUser, isResolvingAuth, user, logout } = useAuth();

  const appData = useAppData(firebaseUser);

  useReminderSystems({
    items: appData.items,
    tasks: appData.tasks,
    logs:  appData.logs,
  });

  const dashboardData = useMemo(
    () => mapToDashboardData({
      tasks:      appData.tasks,
      items:      appData.items,
      weightLogs: appData.weightLogs,
    }),
    [appData.tasks, appData.items, appData.weightLogs]
  );

  const contextValue = useMemo(() => ({
    ...appData,
    user,
  }), [appData, user]);

  // ⏳ Wait until auth + data resolved
  if (isResolvingAuth || appData.loading) {
    return <AppLoader />;
  }

  return (
    <DataProvider value={contextValue}>
      <Routes>

        {/* ✅ FIX: removed onLogin prop (was undefined → crash) */}
        <Route path="/login" element={<Login />} />

        <Route path="/onboarding" element={<Onboarding />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout
                user={user}
                onLogout={logout}
                theme={theme}
                onThemeToggle={toggleTheme}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={dashboardElement(dashboardData, user)} />
          {PROTECTED_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element(appData, user)} />
          ))}
        </Route>

        <Route
          path="*"
          element={<Navigate to={firebaseUser ? "/" : "/login"} replace />}
        />
      </Routes>
    </DataProvider>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <HashRouter>
        <PhoenixWatermark />
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </HashRouter>
    </NotificationProvider>
  );
}