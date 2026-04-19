/**
 * routes.jsx — FIXED PATHS
 */

import React from "react";

// ✅ FIXED: same folder
import Dashboard from "./Dashboard";

// ✅ FIXED: go up 2 levels (these are in src/)
import Productivity from "../../Productivity";
import Habits       from "../../Habits";
import Analytics    from "../../Analytics";
import Finance      from "../../Finance";
import Chat         from "../../Chat";
import Goals        from "../../Goals";
import Profile      from "../../Profile";

export const PROTECTED_ROUTES = [
  {
    path: "productivity",
    element: (appData) => (
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
    element: (appData) => (
      <Habits
        items={appData.items}
        setItems={appData.setItems}
        weightLogs={appData.weightLogs}
        addWeight={appData.addWeight}
      />
    ),
  },
  {
    path: "analytics",
    element: (appData, user) => (
      <Analytics
        logs={appData.logs}
        tasks={appData.tasks}
        user={user}
      />
    ),
  },
  {
    path: "finance",
    element: (appData) => (
      <Finance
        financeData={appData.financeData}
        setFinanceData={appData.setFinanceData}
      />
    ),
  },
  {
    path: "chat",
    element: (appData) => (
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
    element: () => <Goals />,
  },
  {
    path: "profile",
    element: (_appData, user) => <Profile user={user} />,
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