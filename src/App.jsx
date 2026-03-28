import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

import Dashboard from "./Dashboard";
import Analytics from "./Analytics";
import Tasks from "./Tasks";
import Habits from "./Habits";
import Insights from "./Insights";
import Goals from "./Goals";
import Routines from "./Routines";
import Activities from "./Activities";

import { saveData, subscribeToData } from "./cloud";

import Landing from "./Landing";
import Onboarding from "./Onboarding";

import Login from "./Login";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function App() {

  // ================= FIREBASE AUTH =================
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // ================= LOGOUT =================
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
  };

  // ================= LOCAL STATE =================
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user"))
  );

  const [items, setItems] = useState([]);
  const [goal, setGoal] = useState({});
  const [weightLogs, setWeightLogs] = useState([]);
  const [logs, setLogs] = useState({});
  const [tasks, setTasks] = useState([]);

  // ================= 🔥 REAL-TIME SYNC =================
  useEffect(() => {
    if (!firebaseUser) return;

    const unsub = subscribeToData((data) => {
      setItems(data?.items || []);
      setLogs(data?.logs || {});
      setWeightLogs(data?.weightLogs || []);
      setTasks(data?.tasks || []);
      setGoal(data?.goal || {});
    });

    return () => unsub && unsub();
  }, [firebaseUser]);

  // ================= AUTO SAVE =================
  useEffect(() => {
    if (!firebaseUser) return;

    saveData({
      items,
      logs,
      weightLogs,
      tasks,
      goal
    });
  }, [items, logs, weightLogs, tasks, goal, firebaseUser]);

  // ================= ACTIVITY =================
  const updateActivity = (id, change, type = "increment") => {
    const now = new Date();

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let newValue =
          type === "set"
            ? Math.max(0, change)
            : Math.max(0, (item.value || 0) + change);

        return { ...item, value: newValue };
      })
    );

    setLogs((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] || []),
        {
          value: change,
          type,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString()
        }
      ]
    }));
  };

  // ================= TASKS =================
  const addTask = (name) => {
    if (!name) return;

    setTasks((prev) => [
      ...prev,
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

  const startTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, start: new Date().toISOString(), running: true }
          : t
      )
    );
  };

  const endTask = (id) => {
    const end = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        const duration =
          (new Date(end) - new Date(t.start)) / 1000;

        return {
          ...t,
          end,
          duration,
          running: false
        };
      })
    );
  };

  // ================= AUTH FLOW =================
  if (loadingAuth) {
    return <div style={{ color: "white", padding: 40 }}>Loading...</div>;
  }

  if (!firebaseUser) {
    return <Login onLogin={() => {}} />;
  }

  if (!user) {
    return <Landing onStart={() => setUser({})} />;
  }

  if (user && !user.name) {
    return (
      <Onboarding
        onComplete={() =>
          setUser(JSON.parse(localStorage.getItem("user")))
        }
      />
    );
  }

  // ================= MAIN APP =================
  return (
    <BrowserRouter>
      <div style={styles.app}>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <h2 style={styles.logo}>
            🚀 Tracker {user?.name ? `- ${user.name}` : ""}
          </h2>

          <NavLink to="/" style={nav}>Dashboard</NavLink>
          <NavLink to="/habits" style={nav}>Habits</NavLink>
          <NavLink to="/routines" style={nav}>Routines</NavLink>
          <NavLink to="/insights" style={nav}>Insights</NavLink>
          <NavLink to="/goals" style={nav}>Goals</NavLink>
          <NavLink to="/analytics" style={nav}>Analytics</NavLink>
          <NavLink to="/tasks" style={nav}>Tasks</NavLink>
          <NavLink to="/activities" style={nav}>Activities</NavLink>

          <button onClick={handleLogout} style={styles.logout}>
            🚪 Logout
          </button>
        </div>

        {/* MAIN */}
        <div style={styles.main}>
          <Routes>

            <Route path="/" element={
              <Dashboard
                items={items}
                updateActivity={updateActivity}
                logs={logs}
                weightLogs={weightLogs}
              />
            } />

            <Route path="/habits" element={
              <Habits items={items} setItems={setItems} />
            } />

            <Route path="/routines" element={<Routines />} />

            <Route path="/insights" element={
              <Insights items={items} />
            } />

            <Route path="/goals" element={
              <Goals
                goal={goal}
                setGoal={setGoal}
                logs={weightLogs}
                setLogs={setWeightLogs}
              />
            } />

            <Route path="/analytics" element={
              <Analytics logs={logs} />
            } />

            <Route path="/tasks" element={
              <Tasks
                tasks={tasks}
                addTask={addTask}
                startTask={startTask}
                endTask={endTask}
              />
            } />

            <Route path="/activities" element={
              <Activities
                items={items}
                setItems={setItems}
                updateActivity={updateActivity}
              />
            } />

          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

// ================= NAV =================
const nav = ({ isActive }) => ({
  padding: "12px 14px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "#fff" : "#94a3b8",
  background: isActive
    ? "linear-gradient(90deg, #6366f1, #4f46e5)"
    : "transparent"
});

// ================= STYLES =================
const styles = {
  app: {
    display: "flex",
    width: "100%",
    height: "100vh",
    background: "#020617",
    color: "#fff"
  },

  sidebar: {
    width: 260,
    padding: 20,
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    borderRight: "1px solid #1e293b"
  },

  logo: {
    marginBottom: 20,
    fontWeight: 700
  },

  main: {
    flex: 1,
    padding: "30px 40px",
    overflowY: "auto"
  },

  logout: {
    marginTop: "auto",
    padding: "10px",
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer"
  }
};