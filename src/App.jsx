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

/* ================= SAFE ================= */
const safeArray = (v) => (Array.isArray(v) ? v : []);
const safeCall = (fn, ...args) => {
  if (typeof fn === "function") return fn(...args);
};

/* ================= INSTALL BUTTON ================= */
function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log("✅ install prompt fired");
      setPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!promptEvent) return null;

  return (
    <button
      onClick={async () => {
        promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
      }}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "12px 16px",
        borderRadius: "10px",
        background: "#0f172a",
        color: "white",
        border: "none",
        fontWeight: "bold",
        cursor: "pointer",
        zIndex: 9999
      }}
    >
      📲 Install App
    </button>
  );
}

export default function App() {

  /* ================= AUTH ================= */
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);
    });
    return () => safeCall(unsub);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("user");
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

  /* ================= THEME ================= */
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  /* ================= STATES ================= */
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [weightGoal, setWeightGoal] = useState(null);
  const [logs, setLogs] = useState({});
  const [goal, setGoal] = useState({});
  const [financeData, setFinanceData] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  const initialLoad = useRef(true);

  /* ================= LOAD ================= */
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

  /* ================= SAVE ================= */
  useEffect(() => {
    if (!firebaseUser || initialLoad.current) return;

    safeCall(queueSave, {
      items,
      tasks,
      weightLogs,
      weightGoal,
      logs,
      goal,
      financeData,
      chatHistory,
      updatedAt: Date.now()
    });
  }, [items, tasks, weightLogs, weightGoal, logs, goal, financeData, chatHistory, firebaseUser]);

  if (loadingAuth) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <NotificationProvider>

      <InstallButton />

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

            <Route index element={<Dashboard logs={logs} tasks={tasks} items={items} user={user} weightLogs={weightLogs} />} />

            <Route path="habits" element={<Habits items={items} setItems={setItems} weightLogs={weightLogs} />} />

            <Route path="tasks" element={<Tasks tasks={tasks} setTasks={setTasks} />} />

            <Route path="activities" element={<Activities items={items} setItems={setItems} />} />

            <Route path="analytics" element={<Analytics logs={logs} tasks={tasks} user={user} />} />

            <Route path="finance" element={<Finance financeData={financeData} setFinanceData={setFinanceData} />} />

            <Route path="chat" element={<Chat chatHistory={chatHistory} setChatHistory={setChatHistory} items={items} tasks={tasks} weightLogs={weightLogs} />} />

            <Route path="goals" element={<Goals />} />

            <Route path="profile" element={<Profile user={user} />} />

          </Route>

          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>

    </NotificationProvider>
  );
}