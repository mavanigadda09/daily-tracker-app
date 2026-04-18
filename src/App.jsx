```jsx
/**
 * App.jsx — Orchestration Layer
 * ─────────────────────────────────────────────────────────────
 * Responsibilities:
 *  • Mount providers (NotificationProvider, DataProvider)
 *  • Wire routing
 *  • Theme persistence
 *
 * Deliberately contains NO business logic, NO Firebase calls,
 * and NO inline data transformations.
 */

import { useMemo, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { NotificationProvider } from "./context/NotificationContext";
import { DataProvider } from "./context/DataContext";

import { useAuth } from "./hooks/useAuth";
import { useAppData } from "./hooks/useAppData";

import { mapToDashboardData } from "./features/dashboard/dashboardAdapter";

import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import Onboarding from "./Onboarding";
import Dashboard from "./features/dashboard/Dashboard";
import Analytics from "./Analytics";
import Tasks from "./Tasks";
import Habits from "./Habits";
import Goals from "./Goals";
import Activities from "./Activities";
import Profile from "./Profile";
import Chat from "./Chat";
import Finance from "./Finance";

import ReminderSystem from "./system/ReminderSystem";
import HabitReminderSystem from "./system/HabitReminderSystem";

// ─── Theme ────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") ?? "dark"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return [theme, setTheme];
}

// ─── Inner app (needs Router context for useNavigate) ────────
function AppInner() {
  const [theme, setTheme] = useTheme();
  const { firebaseUser, loadingAuth, user, login, logout } = useAuth();

  const appData = useAppData(firebaseUser);

  // Dashboard adapter (memoized)
  const dashboardData = useMemo(
    () =>
      mapToDashboardData({
        tasks: appData.tasks,
        items: appData.items,
        weightLogs: appData.weightLogs,
      }),
    [appData.tasks, appData.items, appData.weightLogs]
  );

  if (loadingAuth || appData.loading) {
    return <div style={{ padding: 20 }}>Loading…</div>;
  }

  return (
    <DataProvider value={appData}>
      <ReminderSystem
        items={appData.items}
        tasks={appData.tasks}
        logs={appData.logs}
      />
      <HabitReminderSystem items={appData.items} />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected shell */}
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
          {/* Dashboard */}
          <Route
            index
            element={
              <Dashboard
                user={user}
                tasks={dashboardData.tasks}
                items={dashboardData.items}
                weightLogs={dashboardData.weightLogs}
              />
            }
          />

          <Route
            path="habits"
            element={
              <Habits
                items={appData.items}
                setItems={appData.setItems}
                weightLogs={appData.weightLogs}
                addWeight={appData.addWeight}
              />
            }
          />

          <Route
            path="tasks"
            element={
              <Tasks
                tasks={appData.tasks}
                setTasks={appData.setTasks}
              />
            }
          />

          <Route
            path="activities"
            element={
              <Activities
                items={appData.items}
                setItems={appData.setItems}
              />
            }
          />

          <Route
            path="analytics"
            element={
              <Analytics
                logs={appData.logs}
                tasks={appData.tasks}
                user={user}
              />
            }
          />

          <Route
            path="finance"
            element={
              <Finance
                financeData={appData.financeData}
                setFinanceData={appData.setFinanceData}
              />
            }
          />

          <Route
            path="chat"
            element={
              <Chat
                chatHistory={appData.chatHistory}
                setChatHistory={appData.setChatHistory}
                items={appData.items}
                tasks={appData.tasks}
                weightLogs={appData.weightLogs}
              />
            }
          />

          <Route path="goals" element={<Goals />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}

// ─── Root export ─────────────────────────────────────────────
export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </NotificationProvider>
  );
}
```
