/**
 * App.jsx — Composition Root
 *
 * Changes from previous version:
 * 1. ProtectedRoute no longer receives firebaseUser prop —
 *    it reads from useAuth() internally (as fixed in ProtectedRoute.jsx).
 *    The prop is removed here to match.
 *
 * 2. Layout no longer receives user/onLogout as props if those
 *    are available via context — left as-is since Layout is not
 *    yet on context. Flagged below for next pass.
 */

import { useMemo }                                from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { NotificationProvider } from "./context/NotificationContext";
import { DataProvider }         from "./context/DataContext";

import { useAuth }            from "./hooks/useAuth";
import { useAppData }         from "./hooks/useAppData";
import { useTheme }           from "./hooks/useTheme";
import { useReminderSystems } from "./hooks/useReminderSystems";

import mapToDashboardData                         from "./features/dashboard/dashboardAdapter";
import { PROTECTED_ROUTES, dashboardElement }     from "./features/dashboard/routes";
import { AppLoader }                              from "./features/dashboard/AppLoader";

import Layout         from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login          from "./pages/Login";
import Onboarding     from "./pages/Onboarding";

// ─── Shell ─────────────────────────────────────────────────────────────────
function AppInner() {
  const [theme, setTheme]                          = useTheme();
  const { firebaseUser, isResolvingAuth, user, login, logout } = useAuth();
  const appData                                    = useAppData(firebaseUser);

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

  // Block render until both auth AND data are ready.
  // isResolvingAuth replaces the old loadingAuth check — same boolean,
  // new name that accurately describes the state.
  if (isResolvingAuth || appData.loading) {
    return <AppLoader />;
  }

  return (
    <DataProvider value={appData}>
      <Routes>
        {/* ── Public ───────────────────────────────────────── */}
        <Route path="/login"      element={<Login onLogin={login} />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ── Protected ────────────────────────────────────── */}
        <Route
          path="/"
          element={
            // ProtectedRoute now reads firebaseUser from useAuth() itself.
            // No prop needed here — removed.
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
          <Route index element={dashboardElement(dashboardData, user)} />

          {PROTECTED_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element(appData, user)} />
          ))}
        </Route>

        {/* ── Fallback ─────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </NotificationProvider>
  );
}