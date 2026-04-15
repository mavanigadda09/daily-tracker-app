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
  console.error("❌ Not a function:", fn);
};

/* ================= INSTALL BUTTON ================= */
function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
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

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);
    });
    return () => safeCall(unsub);
  }, []);

  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [weightGoal, setWeightGoal] = useState(null);
  const [logs, setLogs] = useState({});
  const [goal, setGoal] = useState({});
  const [financeData, setFinanceData] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  const isLocalUpdate = useRef(false);
  const localVersion = useRef(0);
  const initialLoad = useRef(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!firebaseUser) return;

    const fetchData = async () => {
      try {
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

        localVersion.current = data.updatedAt || Date.now();
        initialLoad.current = false;
      } catch (err) {
        console.error("❌ loadData crash:", err);
      }
    };

    fetchData();
  }, [firebaseUser]);

  /* ================= REALTIME ================= */
  useEffect(() => {
    if (!firebaseUser) return;

    let unsub = () => {}; // ✅ always function

    try {
      const result = subscribeToData((data) => {
        if (!data) return;
        if (isLocalUpdate.current) return;
        if (data.updatedAt < localVersion.current) return;

        localVersion.current = data.updatedAt || Date.now();

        setItems(data.items || []);
        setTasks(data.tasks || []);
        setWeightLogs(data.weightLogs || []);
        setWeightGoal(data.weightGoal || null);
        setLogs(data.logs || {});
        setGoal(data.goal || {});
        setFinanceData(data.financeData || []);
        setChatHistory(data.chatHistory || []);
      });

      if (typeof result === "function") {
        unsub = result;
      }

    } catch (err) {
      console.error("❌ subscribe crash:", err);
    }

    return () => safeCall(unsub);
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

  if (loadingAuth) {
    return <div style={{ padding: 20 }}>Loading App...</div>;
  }

  return (
    <NotificationProvider>

      <InstallButton />

      <ReminderSystem items={items} tasks={tasks} logs={logs} />
      <HabitReminderSystem items={items} />

      <BrowserRouter>
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute firebaseUser={firebaseUser}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard logs={logs} tasks={tasks} items={items} />} />
            <Route path="tasks" element={<Tasks tasks={tasks} setTasks={setTasks} />} />
            <Route path="finance" element={<Finance financeData={financeData} setFinanceData={setFinanceData} />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>

    </NotificationProvider>
  );
}