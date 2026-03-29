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

import { saveData, subscribeToData } from "./cloud";

import Landing from "./Landing";
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

  // ================= LOCAL STATE =================
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user"))
  );

  const [items, setItems] = useState([]);
  const [goal, setGoal] = useState({});
  const [weightLogs, setWeightLogs] = useState([]);
  const [logs, setLogs] = useState({});
  const [tasks, setTasks] = useState([]);

  // ================= REALTIME =================
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

    saveData({ items, logs, weightLogs, tasks, goal });
  }, [items, logs, weightLogs, tasks, goal, firebaseUser]);

  // ================= TASK LOGIC (NEW 🔥) =================

  const addTask = (name) => {
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        running: false,
        start: null,
        end: null,
        duration: 0,
        logs: [] // 🔥 important
      }
    ]);
  };

  const startTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              running: true,
              start: Date.now(),
              end: null
            }
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
          duration: duration,
          logs: [
            ...(t.logs || []),
            {
              date,
              duration
            }
          ]
        };
      })
    );
  };

  // ================= AUTH FLOW =================
  if (loadingAuth) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!firebaseUser) {
    return <Login onLogin={() => window.location.reload()} />;
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

  // ================= MAIN =================
  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>

          <Route path="/" element={
            <Dashboard
              items={items}
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

          {/* 🔥 UPDATED ANALYTICS */}
          <Route path="/analytics" element={
            <Analytics logs={logs} tasks={tasks} />
          } />

          {/* 🔥 UPDATED TASKS */}
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
            />
          } />

        </Routes>
      </Layout>
    </BrowserRouter>
  );
}