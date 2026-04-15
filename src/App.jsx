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

/* ================= PWA INSTALL BUTTON ================= */
function InstallButton() {
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [isInstallable, setIsInstallable] = useState(false);

useEffect(() => {
const handler = (e) => {
e.preventDefault();
console.log("✅ beforeinstallprompt fired");
setDeferredPrompt(e);
setIsInstallable(true);
};

```
window.addEventListener("beforeinstallprompt", handler);
return () => window.removeEventListener("beforeinstallprompt", handler);
```

}, []);

const installApp = async () => {
if (!deferredPrompt) return;

```
deferredPrompt.prompt();
const choice = await deferredPrompt.userChoice;

console.log(choice.outcome === "accepted" ? "🎉 Installed" : "❌ Dismissed");

setDeferredPrompt(null);
setIsInstallable(false);
```

};

if (!isInstallable) return null;

return (
<button
onClick={installApp}
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
📲 Install App </button>
);
}

/* ================= SAFE ================= */
const safeArray = (v) => (Array.isArray(v) ? v : []);

export default function App() {

const [loadingScreen, setLoadingScreen] = useState(true);
useEffect(() => {
const timer = setTimeout(() => setLoadingScreen(false), 1000);
return () => clearTimeout(timer);
}, []);

const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
useEffect(() => {
document.body.setAttribute("data-theme", theme);
localStorage.setItem("theme", theme);
}, [theme]);

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

```
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
```

}, [firebaseUser]);

/* ================= REALTIME SYNC (SAFE) ================= */
useEffect(() => {
if (!firebaseUser) return;

```
let unsub;

try {
  unsub = subscribeToData((data) => {
    if (!data) return;

    if (isLocalUpdate.current) return;
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
} catch (err) {
  console.error("❌ subscribeToData error:", err);
}

return () => {
  if (typeof unsub === "function") unsub();
};
```

}, [firebaseUser]);

const safeSetItems = (updater) => {
isLocalUpdate.current = true;

```
setItems(prev => {
  const updated = typeof updater === "function" ? updater(prev) : updater;
  localVersion.current = Date.now();
  return updated;
});

setTimeout(() => (isLocalUpdate.current = false), 1000);
```

};

/* ================= SAVE (SAFE) ================= */
useEffect(() => {
if (!firebaseUser || initialLoad.current) return;

```
try {
  if (typeof queueSave === "function") {
    queueSave({
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
  }
} catch (err) {
  console.error("❌ queueSave error:", err);
}
```

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
<>
{loadingScreen ? (
<div style={{
height: "100vh",
display: "flex",
justifyContent: "center",
alignItems: "center",
background: "#0f172a",
color: "white",
fontSize: "24px"
}}>
🔥 Loading Tracker... </div>
) : ( <NotificationProvider>

```
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

            <Route path="tasks" element={<Tasks tasks={tasks} setTasks={setTasks} />} />
            <Route path="activities" element={<Activities items={items} setItems={safeSetItems} />} />
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
  )}
</>
);
}
