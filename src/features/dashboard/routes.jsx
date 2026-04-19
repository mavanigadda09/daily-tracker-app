/**
 * routes.jsx
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for every route in the app.
 *
 * Shape per route:
 *   path        — React Router path string
 *   element     — factory (appData, user) => ReactElement
 *                 Using a factory keeps components lazy-evaluable and
 *                 avoids capturing stale closures in a static array.
 *
 * To add a route: add one entry here. App.jsx never needs to change.
 */

import React from "react";

import Dashboard    from "./features/dashboard/Dashboard";
import Productivity from "./Productivity";
import Habits       from "./Habits";
import Analytics    from "./Analytics";
import Finance      from "./Finance";
import Chat         from "./Chat";
import Goals        from "./Goals";
import Profile      from "./Profile";

/**
 * @typedef {Object} RouteConfig
 * @property {string} path
 * @property {(appData: import('./hooks/useAppData').AppData, user: object|null, extras?: object) => React.ReactElement} element
 */

/** @type {RouteConfig[]} */
export const PROTECTED_ROUTES = [
  {
    path: "productivity",
    element: (appData) => (
      <Productivity
        tasks={appData.tasks}       setTasks={appData.setTasks}
        items={appData.items}       setItems={appData.setItems}
      />
    ),
  },
  {
    path: "habits",
    element: (appData) => (
      <Habits
        items={appData.items}       setItems={appData.setItems}
        weightLogs={appData.weightLogs}
        addWeight={appData.addWeight}
      />
    ),
  },
  {
    path: "analytics",
    element: (appData, user) => (
      <Analytics logs={appData.logs} tasks={appData.tasks} user={user} />
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

/**
 * Index route element factory — kept here so Dashboard's memoised
 * dashboardData can be passed in without the route config knowing
 * about mapToDashboardData.
 */
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
