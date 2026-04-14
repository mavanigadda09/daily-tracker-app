import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import Dashboard from "./Dashboard";
import Analytics from "./Analytics";
import Tasks from "./Tasks";
import Habits from "./Habits";
import Goals from "./Goals";
import Activities from "./Activities";
import Profile from "./Profile";
import Chat from "./Chat";
import Finance from "./Finance";

import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import Onboarding from "./Onboarding";

import { queueSave, subscribeToData, loadData } from "./cloud";

import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { NotificationProvider } from "./context/NotificationContext";
import ReminderSystem from "./system/ReminderSystem";
import HabitReminderSystem from "./system/HabitReminderSystem";

/* ================= SAFE NOTIFICATION FIX ================= */
if (typeof window !== "undefined" && !("Notification" in window)) {
  window.Notification = function () {};
}

/* ================= SAFE ARRAY HELPER ================= */
const safeArray = (v) => (Array.isArray(v) ? v : []);

export default function App() {

  /* ================= THEME ================= */
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  /* ================= AUTH ================= */
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ================= USER ================= */
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const handleLoginUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  /* ================= DATA ================= */
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [weightGoal, setWeightGoal] = useState(null);
  const [logs, setLogs] = useState({});
  const [goal, setGoal] = useState({});
  const [financeData, setFinanceData] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  const isLocalUpdate = useRef(false);
  const initialLoad = useRef(true);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!firebaseUser) return;

    const fetchData = async () => {
      const data = await loadData();
      if (!data) return;

      setItems(safeArray(data.items));
      setTasks(safeArray(data.tasks));
      setWeightLogs(safeArray(data.weightLogs));
      setWeightGoal(data.weightGoal || null);
      setLogs(data.logs || {});
      setGoal(data.goal || {});
      setFinanceData(safeArray(data.financeData));
      setChatHistory(safeArray(data.chatHistory));

      initialLoad.current = false;
    };

    fetchData();
  }, [firebaseUser]);

  /* ================= REALTIME SYNC ================= */
  useEffect(() => {
    if (!firebaseUser) return;

    const unsub = subscribeToData((data) => {
      if (isLocalUpdate.current) return;

      setItems(safeArray(data.items));
      setTasks(safeArray(data.tasks));
      setWeightLogs(safeArray(data.weightLogs));
      setWeightGoal(data.weightGoal || null);
      setLogs(data.logs || {});
      setGoal(data.goal || {});
      setFinanceData(safeArray(data.financeData));
      setChatHistory(safeArray(data.chatHistory));
    });

    return () => unsub && unsub();
  }, [firebaseUser]);

  /* ================= SAFE SETTERS ================= */
  const safeSetItems = (updater) => {
    isLocalUpdate.current = true;

    setItems(prev => {
      const updated =
        typeof updater === "function" ? updater(prev) : updater;
      return updated;
    });

    setTimeout(() => {
      isLocalUpdate.current = false;
    }, 300);
  };

  /* ================= SAVE DATA ================= */
  useEffect(() => {
    if (!firebaseUser || initialLoad.current) return;

    queueSave({
      items,
      tasks,
      weightLogs,
      weightGoal,
      logs,
      goal,
      financeData,
      chatHistory
    });

  }, [
    items,
    tasks,
    weightLogs,
    weightGoal,
    logs,
    goal,
    financeData,
    chatHistory,
    firebaseUser
  ]);

  /* ================= LOADING ================= */
  if (loadingAuth) {
    return <div style={{ padding: 20 }}>Loading App...</div>;
  }

  return (
    <NotificationProvider>

      <ReminderSystem items={items} tasks={tasks} logs={logs} />
      <HabitReminderSystem items={items} />

      <BrowserRouter>
        <Routes>

          <Route path="/login" element={<Login onLogin={handleLoginUser} />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route
            path="/"
            element={
              <ProtectedRoute firebaseUser={firebaseUser}>
                <Layout
                  user={user}
                  onLogout={handleLogout}
                  theme={theme}
                  setTheme={setTheme}
                />
              </ProtectedRoute>
            }
          >

            <Route index element={
              <Dashboard
                logs={logs}
                tasks={tasks}
                items={items}
                user={user}
                weightLogs={weightLogs}
              />
            }/>

            <Route path="habits" element={
              <Habits
                items={items}
                setItems={safeSetItems}
                weightLogs={weightLogs}
                addWeight={(w) => {
                  setWeightLogs(prev => [
                    ...prev,
                    { weight: w, date: new Date().toISOString() }
                  ]);
                }}
              />
            }/>

            <Route path="tasks" element={
              <Tasks tasks={tasks} setTasks={setTasks} />
            }/>

            <Route path="activities" element={
              <Activities items={items} setItems={safeSetItems} />
            }/>

            <Route path="analytics" element={
              <Analytics logs={logs} tasks={tasks} user={user} />
            }/>

            <Route path="finance" element={
              <Finance
                financeData={financeData}
                setFinanceData={setFinanceData}
              />
            }/>

            <Route path="chat" element={
              <Chat
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
                items={items}
                tasks={tasks}
                weightLogs={weightLogs}
              />
            }/>

            <Route path="goals" element={<Goals />} />
            <Route path="profile" element={<Profile user={user} />} />

          </Route>

          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>

    </NotificationProvider>
  );
}