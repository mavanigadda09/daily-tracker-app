import React, { lazy, Suspense } from "react";
import Dashboard from "./Dashboard";

const Productivity = lazy(() => import("../../productivity/Productivity.jsx"));
const Habits       = lazy(() => import("../../habits/Habits.jsx"));
const Analytics    = lazy(() => import("../../pages/Analytics.jsx"));
const Finance      = lazy(() => import("../finance/Finance.jsx"));
const Chat         = lazy(() => import("../../chat/Chat.jsx"));
const Goals        = lazy(() => import("../goals/Goals.jsx"));
const Routines     = lazy(() => import("../../routines/Routines.jsx"));
const Profile      = lazy(() => import("../../profile/Profile.jsx"));

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
        setWeightLogs={appData.setWeightLogs}
        addWeight={appData.addWeight}
        weightGoal={appData.weightGoal}
        setWeightGoal={appData.setWeightGoal}
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
    element: (appData) => wrap(
      <Goals
        weightLogs={appData.weightLogs}
        setWeightLogs={appData.setWeightLogs}
        weightGoal={appData.weightGoal}
        setWeightGoal={appData.setWeightGoal}
      />
    ),
  },
  {
    path: "routines",
    element: (appData) => wrap(
      <Routines
        items={appData.items}
        setItems={appData.setItems}
      />
    ),
  },
  {
    path: "profile",
    element: () => wrap(<Profile />),
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