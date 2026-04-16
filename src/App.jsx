import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

// Pages
import Dashboard from "./Dashboard";
import Analytics from "./Analytics";
import Habits from "./Habits";
import Goals from "./Goals";
import Productivity from "./Productivity"; 
import Profile from "./Profile";
import Chat from "./Chat";
import Finance from "./Finance";
import Login from "./Login";
import Onboarding from "./Onboarding";

// Components & Systems
import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import InstallButton from "./components/InstallButton"; 
import { NotificationProvider } from "./context/NotificationContext";
import ReminderSystem from "./system/ReminderSystem";
import HabitReminderSystem from "./system/HabitReminderSystem";

// Firebase & Cloud
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { queueSave, subscribeToData, loadData } from "./cloud";

const safeArray = (v) => (Array.isArray(v) ? v : []);

export default function App() {
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

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

  useEffect(() => {
    const timer = setTimeout(() => setLoadingScreen(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleLoginUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

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
      localVersion.current = data.updatedAt || Date.now();
      initialLoad.current = false;
    };
    fetchData();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToData((data) => {
      if (!data || isLocalUpdate.current) return;
      if (data.updatedAt && data.updatedAt < localVersion.current) return;
      
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
    return () => unsub && unsub();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser || initialLoad.current) return;
    queueSave({
      items, tasks, weightLogs, weightGoal, logs, goal, financeData, chatHistory,
      updatedAt: Date.now()
    });
  }, [items, tasks, weightLogs, weightGoal, logs, goal, financeData, chatHistory, firebaseUser]);

  const safeSetItems = (updater) => {
    isLocalUpdate.current = true;
    setItems(prev => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      localVersion.current = Date.now();
      return updated;
    });
    setTimeout(() => (isLocalUpdate.current = false), 1000);
  };

  if (loadingAuth) return <div style={{ padding: 20, background: "#0f172a", height: "100vh", color: "white" }}>Syncing...</div>;

  return (
    <NotificationProvider>
      {loadingScreen ? (
        <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#0f172a", color: "white", fontSize: "24px" }}>
          🔥 Loading Tracker...
        </div>
      ) : (
        <>
          <InstallButton />
          <ReminderSystem items={items} tasks={tasks} logs={logs} />
          <HabitReminderSystem items={items} />

          <BrowserRouter>
            <Routes>
              <Route path="/login" element={firebaseUser ? <Navigate to="/" replace /> : <Login onLogin={handleLoginUser} />} />
              <Route path="/onboarding" element={<Onboarding />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute firebaseUser={firebaseUser}>
                    <Layout user={user} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard logs={logs} tasks={tasks} items={items} user={user} weightLogs={weightLogs} />} />
                
                <Route path="productivity" element={
                  <Productivity 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    items={items} 
                    setItems={safeSetItems} 
                  />
                } />

                <Route path="habits" element={
                  <Habits 
                    items={items} 
                    setItems={safeSetItems} 
                    weightLogs={weightLogs} 
                    addWeight={(w) => setWeightLogs(prev => [...prev, { weight: w, date: new Date().toISOString() }])} 
                  />
                } />

                <Route path="analytics" element={<Analytics logs={logs} tasks={tasks} user={user} />} />
                <Route path="finance" element={<Finance financeData={financeData} setFinanceData={setFinanceData} />} />
                <Route path="chat" element={<Chat chatHistory={chatHistory} setChatHistory={setChatHistory} items={items} tasks={tasks} weightLogs={weightLogs} />} />
                <Route path="goals" element={<Goals />} />
                <Route path="profile" element={<Profile user={user} setUser={setUser} />} />
              </Route>

              <Route path="*" element={<Navigate to={firebaseUser ? "/" : "/login"} replace />} />
            </Routes>
          </BrowserRouter>
        </>
      )}
    </NotificationProvider>
  );
}