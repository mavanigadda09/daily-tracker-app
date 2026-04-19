/**
 * App.jsx — Composition Root
 */

import { useMemo }                                from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { NotificationProvider } from "./context/NotificationContext";
import { DataProvider }         from "./context/DataContext";

import { useAuth }            from "./hooks/useAuth";
import { useAppData }         from "./hooks/useAppData";
import { useTheme }           from "./hooks/useTheme";
import { useReminderSystems } from "./hooks/useReminderSystems";

// ✅ FIX: changed to DEFAULT import (no curly braces)
import mapToDashboardData from "./features/dashboard/dashboardAdapter";

// ✅ already correct
import { PROTECTED_ROUTES, dashboardElement } from "./features/dashboard/routes";
import { AppLoader }                          from "./features/dashboard/AppLoader";

import Layout         from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login          from "./Login";
import Onboarding     from "./Onboarding";

// ─── Shell ─────────────────────────────────────────────────────
function AppInner() {
  const [theme, setTheme]                                  = useTheme();
  const { firebaseUser, loadingAuth, user, login, logout } = useAuth();
  const appData                                            = useAppData(firebaseUser);

  useReminderSystems({
    items : appData.items,
    tasks : appData.tasks,
    logs  : appData.logs,
  });

  const dashboardData = useMemo(
    () => mapToDashboardData({
      tasks      : appData.tasks,
      items      : appData.items,
      weightLogs : appData.weightLogs,
    }),
    [appData.tasks, appData.items, appData.weightLogs]
  );

  if (loadingAuth || appData.loading) {
    return <AppLoader />;
  }

  return (
    <DataProvider value={appData}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute firebaseUser={firebaseUser}>
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}

// ─── Root ──────────────────────────────────────────────────────
export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </NotificationProvider>
  );
}