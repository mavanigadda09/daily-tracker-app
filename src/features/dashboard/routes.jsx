import React, { lazy, Suspense } from "react";

// ─── Eager ────────────────────────────────────────────────────
import Dashboard from "./Dashboard";

// ─── Lazy Imports (FINAL CORRECT PATHS) ───────────────────────
const Productivity = lazy(() => import("../../productivity/Productivity.jsx"));
const Habits       = lazy(() => import("../../habits/Habits.jsx")); // ✅ FIXED
const Analytics    = lazy(() => import("../../pages/Analytics.jsx"));
const Finance      = lazy(() => import("../finance/Finance.jsx"));
const Chat         = lazy(() => import("../../chat/Chat.jsx"));
const Goals        = lazy(() => import("../goals/Goals.jsx"));
const Profile      = lazy(() => import("../../profile/Profile.jsx"));

// ─── Loader ───────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    color: "var(--color-text-secondary)",
    fontSize: "0.9rem",
  }}>
    Loading…
  </div>
);

const wrap = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

// ─── Routes ───────────────────────────────────────────────────
export const PROTECTED_ROUTES = [
  {
    path: "productivity",
    element: (appData) => wrap(
      <Productivity
        tasks={appData.tasks}
        setTasks={appData.setTasks}
        items={appData.items}
        setItems={appData.setItems}
      />
    ),
  },

  {
    path: "habits",
    element: (appData) => wrap(
      <Habits
        items={appData.items}
        setItems={appData.setItems}
        weightLogs={appData.weightLogs}
      />
    ),
  },

  {
    path: "analytics",
    element: (appData, user) => wrap(
      <Analytics
        logs={appData.logs}
        tasks={appData.tasks}
        user={user}
      />
    ),
  },

  {
    path: "finance",
    element: (appData) => wrap(
      <Finance
        financeData={appData.financeData}
        setFinanceData={appData.setFinanceData}
      />
    ),
  },

  {
    path: "chat",
    element: (appData) => wrap(
      <Chat
        chatHistory={appData.chatHistory}
        setChatHistory={appData.setChatHistory}
        items={appData.items}
        tasks={appData.tasks}
        weightLogs={appData.weightLogs}
      />
    ),
  },

  {
    path: "goals",
    element: () => wrap(<Goals />),
  },

  {
    path: "profile",
    element: (_appData, user) => wrap(<Profile user={user} />),
  },
];

// ─── Dashboard ────────────────────────────────────────────────
export function dashboardElement(dashboardData, user) {
  return (
    <Dashboard
      user={user}
      tasks={dashboardData.tasks}
      items={dashboardData.items}
      weightLogs={dashboardData.weightLogs}
    />
  );
}