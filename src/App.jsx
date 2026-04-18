/**
 * App.jsx — Orchestration Layer
 * ─────────────────────────────────────────────────────────────
 * Responsibilities:
 * • Mount Providers (Notification, Router, DataContext)
 * • Centralized Routing & Protected Shell
 * • App-wide Loading States
 */

import { useMemo, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Context & Hooks
import { NotificationProvider } from "./context/NotificationContext";
import { DataProvider }         from "./context/DataContext";
import { useAuth }              from "./hooks/useAuth";
import { useAppData }           from "./hooks/useAppData";

// Components & Pages
import Layout         from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login          from "./Login";
import Onboarding     from "./Onboarding";
import Dashboard      from "./features/dashboard/Dashboard";
import Analytics      from "./Analytics";
import Tasks          from "./Tasks";
import Habits         from "./Habits";
import Goals          from "./Goals";
import Activities     from "./Activities";
import Profile        from "./Profile";
import Chat           from "./Chat";
import Finance        from "./Finance";

// Systems
import ReminderSystem       from "./system/ReminderSystem";
import HabitReminderSystem  from "./system/HabitReminderSystem";

// ─── Theme Logic ─────────────────────────────────────────────
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

// ─── App Engine ──────────────────────────────────────────────
function AppInner() {
  const [theme, setTheme] = useTheme();
  const { firebaseUser, loadingAuth, user, login, logout } = useAuth();
  
  // Initialize data hook - handles Firebase sync/load internally
  const appData = useAppData(firebaseUser);

  // Global Loading State
  if (loadingAuth || appData.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Loading System...</div>
      </div>
    );
  }

  return (
    <DataProvider value={appData}>
      {/* Background Systems */}
      <ReminderSystem 
        items={appData.items} 
        tasks={appData.tasks} 
        logs={appData.logs} 
      />
      <HabitReminderSystem items={appData.items} />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected Application Shell */}
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
          {/* All sub-routes below NO LONGER need manual props.
             They will use useDataContext() internally.
          */}
          <Route index element={<Dashboard user={user} />} />
          
          <Route path="habits"     element={<Habits />} />
          <Route path="tasks"      element={<Tasks />} />
          <Route path="activities" element={<Activities />} />
          <Route path="analytics"  element={<Analytics user={user} />} />
          <Route path="finance"    element={<Finance />} />
          <Route path="chat"       element={<Chat />} />
          <Route path="goals"      element={<Goals />} />
          <Route path="profile"    element={<Profile user={user} />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}

// ─── Root Entry ──────────────────────────────────────────────
export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </NotificationProvider>
  );
}