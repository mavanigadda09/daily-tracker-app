import { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

function AppInner() {
  const [theme, setTheme] = useTheme();
  const { firebaseUser, isResolvingAuth, user, login, logout } = useAuth();
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

  if (isResolvingAuth || appData.loading) {
    return <AppLoader />;
  }

  return (
    <DataProvider value={appData}>
      <Routes>
        <Route path="/login"      element={<Login onLogin={login} />} />
        <Route path="/onboarding" element={<Onboarding />} />

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
      <BrowserRouter>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </BrowserRouter>
    </NotificationProvider>
  );
}