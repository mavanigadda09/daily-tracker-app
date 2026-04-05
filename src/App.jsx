import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Dashboard from "./Dashboard";
import Analytics from "./Analytics";
import Tasks from "./Tasks";
import Habits from "./Habits";
import Insights from "./Insights";
import Goals from "./Goals";
import Activities from "./Activities";
import Profile from "./Profile";
import Weight from "./Weight";
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

// ✅ NEW IMPORT
import HabitReminderSystem from "./system/HabitReminderSystem";

export default function App() {

  // ===== THEME =====
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ===== AUTH =====
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
    try {
      await signOut(auth);
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // ===== USER =====
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

  // ===== DATA =====
  const [items, setItems] = useState([]);
  const [goal, setGoal] = useState({});
  const [weightLogs, setWeightLogs] = useState([]);
  const [weightGoal, setWeightGoal] = useState(null);
  const [logs, setLogs] = useState({});
  const [tasks, setTasks] = useState([]);
  const [financeData, setFinanceData] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);

  // ===== LOAD DATA =====
  useEffect(() => {
    if (!firebaseUser) return;

    const fetchData = async () => {
      try {
        const data = await loadData();
        if (!data) return;

        setItems(data.items || []);
        setLogs(data.logs || {});
        setWeightLogs(data.weightLogs || []);
        setWeightGoal(data.weightGoal || null);
        setTasks(data.tasks || []);
        setGoal(data.goal || {});
        setFinanceData(data.financeData || []);
        setChatHistory(data.chatHistory || []);
      } catch (err) {
        console.error("Load error:", err);
      }
    };

    fetchData();
  }, [firebaseUser]);

  // ===== REALTIME SYNC =====
  useEffect(() => {
    if (!firebaseUser) return;

    const unsub = subscribeToData((data) => {
      setItems(data.items || []);
      setLogs(data.logs || {});
      setWeightLogs(data.weightLogs || []);
      setWeightGoal(data.weightGoal || null);
      setTasks(data.tasks || []);
      setGoal(data.goal || {});
      setFinanceData(data.financeData || []);
      setChatHistory(data.chatHistory || []);
      setInitialLoad(false);
    });

    return () => unsub && unsub();
  }, [firebaseUser]);

  // ===== SAVE DATA =====
  useEffect(() => {
    if (!firebaseUser || initialLoad) return;

    try {
      queueSave({
        items,
        logs,
        weightLogs,
        weightGoal,
        tasks,
        goal,
        financeData,
        chatHistory
      });
    } catch (err) {
      console.error("Save error:", err);
    }

  }, [
    items,
    logs,
    weightLogs,
    weightGoal,
    tasks,
    goal,
    financeData,
    chatHistory,
    firebaseUser,
    initialLoad
  ]);

  // ===== LOADING =====
  if (loadingAuth) {
    return (
      <div style={{ padding: 20, color: "var(--text)" }}>
        Loading App...
      </div>
    );
  }

  return (
    <NotificationProvider>

      {/* 🔔 GENERAL REMINDERS */}
      <ReminderSystem
        items={items}
        tasks={tasks}
        logs={logs}
      />

      {/* 🔥 HABIT REMINDERS (NEW) */}
      <HabitReminderSystem
        items={items}
      />

      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route
            path="/login"
            element={<Login onLogin={handleLoginUser} />}
          />

          <Route path="/onboarding" element={<Onboarding />} />

          {/* PROTECTED */}
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

            <Route
              index
              element={
                <Dashboard
                  logs={logs}
                  tasks={tasks}
                  items={items}
                  user={user}
                  weightLogs={weightLogs}
                />
              }
            />

            <Route
              path="finance"
              element={
                <Finance
                  financeData={financeData}
                  setFinanceData={setFinanceData}
                />
              }
            />

            <Route
              path="chat"
              element={
                <Chat
                  chatHistory={chatHistory}
                  setChatHistory={setChatHistory}
                  items={items}
                  tasks={tasks}
                  weightLogs={weightLogs}
                />
              }
            />

            <Route
              path="weight"
              element={<Weight weightLogs={weightLogs} />}
            />

            <Route
              path="habits"
              element={
                <Habits
                  items={items}
                  setItems={setItems}
                />
              }
            />

            <Route
              path="tasks"
              element={
                <Tasks
                  tasks={tasks}
                  setTasks={setTasks}
                />
              }
            />

            <Route
              path="activities"
              element={
                <Activities
                  items={items}
                  setItems={setItems}
                />
              }
            />

            <Route
              path="analytics"
              element={<Analytics logs={logs} />}
            />

            <Route
              path="insights"
              element={<Insights items={items} />}
            />

            <Route path="goals" element={<Goals />} />

            <Route
              path="profile"
              element={<Profile user={user} />}
            />

          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>

    </NotificationProvider>
  );
}