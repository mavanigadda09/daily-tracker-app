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

import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import Onboarding from "./Onboarding";

import { queueSave, subscribeToData, loadData } from "./cloud";

import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function App() {

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
    await signOut(auth);
    localStorage.clear();
    window.location.href = "/login"; // ✅ FIX
  };

  // ===== USER =====
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user")) || null
  );

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

  // ===== LOAD =====
  useEffect(() => {
    if (!firebaseUser) return;

    loadData().then((data) => {
      if (!data) return;

      setItems(data.items || []);
      setLogs(data.logs || {});
      setWeightLogs(data.weightLogs || []);
      setWeightGoal(data.weightGoal || null);
      setTasks(data.tasks || []);
      setGoal(data.goal || {});
      setFinanceData(data.financeData || []);
      setChatHistory(data.chatHistory || []);
    });
  }, [firebaseUser]);

  // ===== REALTIME =====
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

  // ===== SAVE =====
  useEffect(() => {
    if (!firebaseUser || initialLoad) return;

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

  }, [items, logs, weightLogs, weightGoal, tasks, goal, financeData, chatHistory, firebaseUser, initialLoad]);

  // ===== WEIGHT =====
  const addWeight = (value) => {
    if (!value) return;
    const today = new Date().toDateString();

    setWeightLogs((prev) => {
      const exists = prev.find((w) => w.date === today);
      return exists
        ? prev.map((w) => w.date === today ? { ...w, weight: value } : w)
        : [...prev, { date: today, weight: value }];
    });
  };

  const deleteWeight = (date) => {
    setWeightLogs((prev) => prev.filter((w) => w.date !== date));
  };

  // ===== LOADING =====
  if (loadingAuth) return <div>Loading...</div>;

  // ===== ROUTES =====
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login onLogin={handleLoginUser} />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* PROTECTED ROUTES */}
        <Route path="/" element={
          <ProtectedRoute user={user} firebaseUser={firebaseUser}>
            <Layout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }>

          <Route index element={<Dashboard />} />
          <Route path="chat" element={
            <Chat
              items={items}
              tasks={tasks}
              weightLogs={weightLogs}
              user={user}
              financeData={financeData}
              module="general"
              chatHistory={chatHistory}
              onHistoryChange={setChatHistory}
            />
          } />

          <Route path="weight" element={
            <Weight
              weightLogs={weightLogs}
              addWeight={addWeight}
              deleteWeight={deleteWeight}
              weightGoal={weightGoal}
              setWeightGoal={setWeightGoal}
              items={items}
            />
          } />

          <Route path="habits" element={<Habits items={items} setItems={setItems} />} />
          <Route path="tasks" element={<Tasks tasks={tasks} />} />
          <Route path="activities" element={<Activities items={items} setItems={setItems} />} />
          <Route path="analytics" element={<Analytics logs={logs} tasks={tasks} user={user} />} />
          <Route path="insights" element={<Insights items={items} />} />
          <Route path="goals" element={<Goals goal={goal} setGoal={setGoal} logs={weightLogs} setLogs={setWeightLogs} />} />
          <Route path="profile" element={<Profile user={user} />} />

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}