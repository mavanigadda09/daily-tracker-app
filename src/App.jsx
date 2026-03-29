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
  const [logs, setLogs] = useState({});
  const [tasks, setTasks] = useState([]);

  const [history, setHistory] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);

  // ================= 📴 OFFLINE LOAD =================
  useEffect(() => {
    if (!firebaseUser) return;

    const init = async () => {
      const data = await loadData();
      if (!data) return;

      setItems(data.items);
      setLogs(data.logs);
      setWeightLogs(data.weightLogs);
      setTasks(data.tasks);
      setGoal(data.goal);
      setHistory(data.history || []);
    };

    init();
  }, [firebaseUser]);

  // ================= ☁️ REALTIME =================
  useEffect(() => {
    if (!firebaseUser) return;

    const unsub = subscribeToData((data) => {
      setItems(data.items);
      setLogs(data.logs);
      setWeightLogs(data.weightLogs);
      setTasks(data.tasks);
      setGoal(data.goal);
      setHistory(data.history || []);

      setInitialLoad(false);
    });

    return () => unsub && unsub();
  }, [firebaseUser]);

  // ================= 💾 SAVE =================
  useEffect(() => {
    if (!firebaseUser || initialLoad) return;

    const data = {
      items,
      logs,
      weightLogs,
      tasks,
      goal,
      history
    };

    queueSave(data);

  }, [items, logs, weightLogs, tasks, goal, history, firebaseUser, initialLoad]);

  // ================= 🔙 UNDO =================
  const undoLastChange = () => {
    if (!history || history.length < 2) return;

    const prev = history[history.length - 2];
    if (!prev) return;

    const state = prev.data;

    setItems(state.items || []);
    setLogs(state.logs || {});
    setWeightLogs(state.weightLogs || []);
    setTasks(state.tasks || []);
    setGoal(state.goal || {});

    setHistory(history.slice(0, -1));
  };

  // ================= 🔁 RESTORE VERSION =================
  const restoreVersion = (snapshot) => {
    if (!snapshot) return;

    const state = snapshot.data;

    setItems(state.items || []);
    setLogs(state.logs || {});
    setWeightLogs(state.weightLogs || []);
    setTasks(state.tasks || []);
    setGoal(state.goal || {});
  };

  // ================= TASK LOGIC =================
  const addTask = (name) => {
    if (!name) return;

    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        running: false,
        start: null,
        end: null,
        duration: 0,
        logs: []
      }
    ]);
  };

  const startTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, running: true, start: Date.now(), end: null }
          : t
      )
    );
  };

  const endTask = (id, duration, date) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        return {
          ...t,
          running: false,
          end: Date.now(),
          duration,
          logs: [...(t.logs || []), { date, duration }]
        };
      })
    );
  };

  // ================= AUTH FLOW =================
  if (loadingAuth) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!firebaseUser) return <Login onLogin={handleLoginUser} />;
  if (!user || !user.name) return <Onboarding onComplete={setUser} />;

  // ================= MAIN =================
  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>

          <Route path="/" element={
            <Dashboard
              items={items}
              logs={logs}
              tasks={tasks}
              user={user}
              onUndo={undoLastChange}
              history={history}
              onRestoreVersion={restoreVersion}
              setGoal={setGoal} // 🔥 FINAL FIX
            />
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
              <Tasks
                tasks={tasks}
                addTask={addTask}
                startTask={startTask}
                endTask={endTask}
              />
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