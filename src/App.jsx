import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Dashboard from "./Dashboard";
import Analytics from "./Analytics";
import Tasks from "./Tasks";
import Habits from "./Habits";
import Insights from "./Insights";
import Goals from "./Goals";
import Routines from "./Routines";
import Activities from "./Activities";
import Profile from "./Profile";
import ProtectedRoute from "./ProtectedRoute";
import Weight from "./Weight";
import Chat from "./Chat";

import { queueSave, subscribeToData, loadData } from "./cloud";

import Onboarding from "./Onboarding";
import Login from "./Login";
import Layout from "./Layout";

import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function App() {

  // ================= AUTH =================
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
    window.location.reload();
  };

  // ================= USER =================
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user")) || null
  );

  const handleLoginUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // ================= DATA =================
  const [items, setItems] = useState([]);
  const [goal, setGoal] = useState({});
  const [weightLogs, setWeightLogs] = useState([]);
  const [weightGoal, setWeightGoal] = useState(null);
  const [logs, setLogs] = useState({});
  const [tasks, setTasks] = useState([]);
  const [financeData, setFinanceData] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  const [initialLoad, setInitialLoad] = useState(true);

  // ================= LOAD =================
  useEffect(() => {
    if (!firebaseUser) return;

    const init = async () => {
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
    };

    init();
  }, [firebaseUser]);

  // ================= REALTIME =================
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

  // ================= SAVE =================
  useEffect(() => {
    if (!firebaseUser || initialLoad) return;

    const data = {
      items,
      logs,
      weightLogs,
      weightGoal,
      tasks,
      goal,
      financeData,
      chatHistory
    };

    queueSave(data);

  }, [items, logs, weightLogs, weightGoal, tasks, goal, financeData, chatHistory, firebaseUser, initialLoad]);

  // ================= WEIGHT =================
  const addWeight = (value) => {
    if (!value) return;

    const today = new Date().toDateString();

    setWeightLogs((prev) => {
      const exists = prev.find((w) => w.date === today);

      if (exists) {
        return prev.map((w) =>
          w.date === today ? { ...w, weight: value } : w
        );
      }

      return [...prev, { date: today, weight: value }];
    });
  };

  const deleteWeight = (date) => {
    setWeightLogs((prev) =>
      prev.filter((w) => w.date !== date)
    );
  };

  // ================= ROUTES =================
  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>

          <Route path="/" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
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
            </ProtectedRoute>
          } />

          <Route path="/weight" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Weight
                weightLogs={weightLogs}
                addWeight={addWeight}
                deleteWeight={deleteWeight}
                weightGoal={weightGoal}
                setWeightGoal={setWeightGoal}
                items={items}
              />
            </ProtectedRoute>
          } />

          <Route path="/habits" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Habits items={items} setItems={setItems} />
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Analytics logs={logs} tasks={tasks} user={user} />
            </ProtectedRoute>
          } />

          <Route path="/tasks" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Tasks tasks={tasks} />
            </ProtectedRoute>
          } />

          <Route path="/activities" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Activities items={items} setItems={setItems} />
            </ProtectedRoute>
          } />

          <Route path="/insights" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Insights items={items} />
            </ProtectedRoute>
          } />

          <Route path="/goals" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Goals
                goal={goal}
                setGoal={setGoal}
                logs={weightLogs}
                setLogs={setWeightLogs}
              />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute user={user} firebaseUser={firebaseUser}>
              <Profile user={user} />
            </ProtectedRoute>
          } />

        </Routes>
      </Layout>
    </BrowserRouter>
  );
}