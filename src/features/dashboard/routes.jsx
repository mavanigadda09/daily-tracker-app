/**
 * routes.jsx — lazy-loaded routes for code splitting
 */
import React, { lazy, Suspense } from "react";

// ─── Eager (above the fold — always needed) ───────────────────
import Dashboard from "./Dashboard";

// ─── Lazy (loaded only when user navigates there) ─────────────
const Productivity = lazy(() => import("../../productivity/Productivity"));
const Habits       = lazy(() => import("../../habits/Habits"));
const Analytics    = lazy(() => import("../../pages/Analytics"));
const Finance      = lazy(() => import("../finance/Finance"));
const Chat         = lazy(() => import("../../chat/Chat"));
const Goals        = lazy(() => import("../goals/Goals"));
const Profile      = lazy(() => import("../../profile/Profile"));

// ─── Fallback ─────────────────────────────────────────────────
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
  path: "/habits",
  element: (data, user) => (
    <Habits
      items={data.items}
      setItems={data.setItems}
      weightLogs={data.weightLogs}
    />
  )
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