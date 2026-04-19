/**
 * App.jsx — Composition Root
 * ─────────────────────────────────────────────────────────────
 * Single responsibility: wire providers, hooks, and the route tree.
 * No business logic. No Firebase calls. No inline styles.
 *
 * Reading order:
 *   1. Providers  (App)      — NotificationProvider, BrowserRouter
 *   2. Shell      (AppInner) — auth + data hooks, loading gate
 *   3. Routes     (routes.jsx) — all route definitions live there
 */

import { useMemo }                                from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { NotificationProvider } from "./context/NotificationContext";
import { DataProvider }         from "./context/DataContext";

import { useAuth }            from "./hooks/useAuth";
import { useAppData }         from "./hooks/useAppData";
import { useTheme }           from "./hooks/useTheme";
import { useReminderSystems } from "./hooks/useReminderSystems";

import { mapToDashboardData }                    from "./features/dashboard/dashboardAdapter";
import { PROTECTED_ROUTES, dashboardElement }    from "./routes";
import { AppLoader }                             from "./AppLoader";

import Layout         from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login          from "./Login";
import Onboarding     from "./Onboarding";

// ─── Shell (needs Router context for useNavigate inside useAuth) ──
function AppInner() {
  const [theme, setTheme]                                  = useTheme();
  const { firebaseUser, loadingAuth, user, login, logout } = useAuth();
  const appData                                            = useAppData(firebaseUser);

  // Reminder systems are pure side effects — run as a hook, not JSX.
  useReminderSystems({
    items : appData.items,
    tasks : appData.tasks,
    logs  : appData.logs,
  });

  // Recompute only when the three relevant slices change.
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
        {/* ── Public ─────────────────────────────────────────── */}
        <Route path="/login"      element={<Login onLogin={login} />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ── Protected shell ────────────────────────────────── */}
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
          {/* Index — Dashboard with memoised data */}
          <Route
            index
            element={dashboardElement(dashboardData, user)}
          />

          {/* All other protected routes driven by config in routes.jsx */}
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

// ─── Root — provides Router + global notification context ─────
export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </NotificationProvider>
  );
}
