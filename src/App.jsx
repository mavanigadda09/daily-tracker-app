import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import Analytics from "./Analytics";
import Tasks from "./Tasks";

export default function App() {

  // ================================
  // 🔥 ACTIVITY STATE
  // ================================
  const [activities, setActivities] = useState(
    () => JSON.parse(localStorage.getItem("activities")) || []
  );

  // ================================
  // 📊 ACTIVITY LOGS (FOR ANALYTICS)
  // ================================
  const [logs, setLogs] = useState(
    () => JSON.parse(localStorage.getItem("logs")) || {}
  );

  // ================================
  // ⏱ TASK STATE (TIME TRACKING)
  // ================================
  const [tasks, setTasks] = useState(
    () => JSON.parse(localStorage.getItem("tasks")) || []
  );

  // ================================
  // 💾 LOCAL STORAGE SYNC
  // ================================
  useEffect(() => {
    localStorage.setItem("activities", JSON.stringify(activities));
    localStorage.setItem("logs", JSON.stringify(logs));
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [activities, logs, tasks]);

  // ================================
  // ➕ ADD ACTIVITY
  // ================================
  const addActivity = (name, target) => {
    if (!name) return;

    setActivities([
      ...activities,
      {
        id: Date.now(),
        name,
        target: Number(target),
        value: 0
      }
    ]);
  };

  // ================================
  // 🔄 UPDATE ACTIVITY VALUE
  // (Input-based + / - system)
  // ================================
  const updateActivity = (id, changeValue) => {
    const now = new Date();

    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, value: Math.max(0, a.value + changeValue) }
          : a
      )
    );

    // Save log (hidden from UI)
    setLogs((prev) => {
      const prevLogs = prev[id] || [];

      return {
        ...prev,
        [id]: [
          ...prevLogs,
          {
            value: changeValue,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString()
          }
        ]
      };
    });
  };

  // ================================
  // ➕ ADD TASK
  // ================================
  const addTask = (name) => {
    if (!name) return;

    setTasks([
      ...tasks,
      {
        id: Date.now(),
        name,
        start: null,
        end: null,
        duration: 0,
        running: false
      }
    ]);
  };

  // ================================
  // ▶ START TASK
  // ================================
  const startTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, start: new Date().toISOString(), running: true }
          : t
      )
    );
  };

  // ================================
  // ⏹ END TASK
  // ================================
  const endTask = (id) => {
    const endTime = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        const duration =
          (new Date(endTime) - new Date(t.start)) / 1000;

        return {
          ...t,
          end: endTime,
          duration,
          running: false
        };
      })
    );
  };

  // ================================
  // 🎨 UI RENDER
  // ================================
  return (
    <BrowserRouter>
      <div style={styles.app}>

        {/* ================================
            📌 SIDEBAR NAVIGATION
        ================================ */}
        <div style={styles.sidebar}>
          <h2>🚀 Tracker</h2>

          <NavLink to="/" style={({ isActive }) =>
            isActive ? styles.active : styles.link
          }>
            Dashboard
          </NavLink>

          <NavLink to="/tasks" style={({ isActive }) =>
            isActive ? styles.active : styles.link
          }>
            Tasks
          </NavLink>

          <NavLink to="/analytics" style={({ isActive }) =>
            isActive ? styles.active : styles.link
          }>
            Analytics
          </NavLink>
        </div>

        {/* ================================
            📄 MAIN CONTENT AREA
        ================================ */}
        <div style={styles.main}>
          <Routes>

            {/* Dashboard */}
            <Route
              path="/"
              element={
                <Dashboard
                  activities={activities}
                  addActivity={addActivity}
                  updateActivity={updateActivity}
                />
              }
            />

            {/* Tasks */}
            <Route
              path="/tasks"
              element={
                <Tasks
                  tasks={tasks}
                  addTask={addTask}
                  startTask={startTask}
                  endTask={endTask}
                />
              }
            />

            {/* Analytics */}
            <Route
              path="/analytics"
              element={<Analytics logs={logs} />}
            />

          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

// ================================
// 🎨 STYLES
// ================================
const styles = {
  app: {
    display: "flex",
    height: "100vh",
    background: "#020617",
    color: "#fff"
  },

  sidebar: {
    width: 220,
    background: "#0f172a",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  link: {
    color: "#94a3b8",
    padding: 10,
    borderRadius: 8,
    textDecoration: "none"
  },

  active: {
    background: "#6366f1",
    color: "#fff",
    padding: 10,
    borderRadius: 8
  },

  main: {
    flex: 1,
    padding: 30,
    overflow: "auto"
  }
};