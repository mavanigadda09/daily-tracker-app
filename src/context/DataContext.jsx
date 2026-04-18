/**
 * DataContext.jsx
 * ─────────────────────────────────────────────────────────────
 * Wraps the app so any component can read/write shared data
 * without prop-drilling through Layout.
 *
 * Usage:
 *   const { tasks, setTasks } = useDataContext();
 */

import React, { createContext, useContext } from "react";

const DataContext = createContext(null);

export function DataProvider({ children, value }) {
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useDataContext must be used inside <DataProvider>");
  }
  return ctx;
}
