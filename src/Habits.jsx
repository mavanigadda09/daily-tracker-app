import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

// ===== UTIL =====
const getKey = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const isYesterday = (d1, d2) => {
  const a = new Date(d1);
  const b = new Date(d2);
  a.setDate(a.getDate() - 1);
  return getKey(a) === getKey(b);
};

// ===== COMPONENT =====
export default function Habits() {

  // ✅ LOCAL STORAGE STATE (FIXES DELETE BUG)
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("habits");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(items));
  }, [items]);

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [targetDays, setTargetDays] = useState(30);

  const [view, setView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeKey = getKey(selectedDate);

  // ===== DATE =====
  const getDates = () => {
    const today = new Date();

    if (view === "today") return [today];

    if (view === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        return d;
      });
    }

    const year = today.getFullYear();
    const month = today.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: days }, (_, i) =>
      new Date(year, month, i + 1)
    );
  };

  const dates = getDates();

  // ===== FILTER =====
  const isCompleted = (habit) =>
    habit.completed?.[activeKey]?.done;

  const completedHabits = habits.filter(isCompleted);
  const pendingHabits = habits.filter(h => !isCompleted(h));

  const completionRate = habits.length
    ? Math.round((completedHabits.length / habits.length) * 100)
    : 0;

  const colors = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#f97316,#fb7185)",
    "linear-gradient(135deg,#22c55e,#4ade80)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)"
  ];

  // ===== ADD / EDIT =====
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (editId) {
      setItems(prev =>
        prev.map(i =>
          i.id === editId
            ? { ...i, name, time, targetDays: Number(targetDays) }
            : i
        )
      );
    } else {
      setItems(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name,
          type: "habit",
          completed: {},
          xp: 0,
          streak: 0,
          bestStreak: 0,
          time,
          targetDays: Number(targetDays)
        }
      ]);
    }

    resetForm();
  };

  const resetForm = () => {
    setName("");
    setTime("");
    setTargetDays(30);
    setShowForm(false);
    setEditId(null);
  };

  // ===== TOGGLE (FIXED CORE LOGIC) =====
  const toggleDay = (id) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };

        // ❌ Prevent XP abuse
        if (completed[activeKey]?.done) return item;

        // ===== STREAK LOGIC =====
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = getKey(yesterday);

        const hadYesterday = completed[yKey]?.done;

        const newStreak = hadYesterday
          ? item.streak + 1
          : 1;

        return {
          ...item,
          completed: {
            ...completed,
            [activeKey]: { done: true, value: 1, note: "" }
          },
          xp: item.xp + 10,
          streak: newStreak,
          bestStreak: Math.max(item.bestStreak || 0, newStreak)
        };
      })
    );
  };

  const unmarkDay = (id) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };
        delete completed[activeKey];

        return { ...item, completed };
      })
    );
  };

  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const editHabit = (h) => {
    setName(h.name);
    setTime(h.time);
    setTargetDays(h.targetDays);
    setEditId(h.id);
    setShowForm(true);
  };

  return (
    <div style={styles.container}>

      <h1>🔥 Habits</h1>
      <h2>{completionRate}% completed today</h2>

      {/* VIEW */}
      <div style={styles.tabs}>
        {["today","week","month"].map(v => (
          <button key={v} onClick={()=>setView(v)}>
            {v}
          </button>
        ))}
      </div>

      {/* DATE */}
      <div style={{
        ...styles.dateRow,
        flexWrap: view === "month" ? "wrap" : "nowrap"
      }}>
        {dates.map((d,i)=>{
          const key = getKey(d);
          const active = key === activeKey;

          return (
            <div key={i}
              onClick={()=>setSelectedDate(d)}
              style={{
                ...styles.dateCard,
                background: active ? "#ef4444" : "#111",
                color:"#fff"
              }}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>

      {/* CREATE */}
      {!showForm && (
        <div onClick={()=>setShowForm(true)} style={styles.createCard}>
          ➕ Create Habit
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit}>
          <input value={name} onChange={e=>setName(e.target.value)} />
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
          <input type="number" value={targetDays} onChange={e=>setTargetDays(e.target.value)} />

          <button type="submit">{editId ? "Update":"Add"}</button>
          <button type="button" onClick={resetForm}>Close</button>
        </form>
      )}

      {/* PENDING */}
      <h3>Pending</h3>
      {pendingHabits.map((h,i)=>(
        <div key={h.id} style={{...styles.card, background:colors[i%4]}}>
          <h3>{h.name}</h3>
          <p>🔥 {h.streak}</p>
          <p>🏆 Best: {h.bestStreak || 0}</p>
          <p>⚡ {h.xp}</p>

          <button onClick={()=>toggleDay(h.id)}>Done</button>
          <button onClick={()=>editHabit(h)}>Edit</button>
          <button onClick={()=>deleteHabit(h.id)}>Delete</button>
        </div>
      ))}

      {/* COMPLETED */}
      <h3>Completed</h3>
      {completedHabits.map((h,i)=>(
        <div key={h.id} style={{...styles.card, background:colors[i%4]}}>
          <h3>{h.name}</h3>

          <button onClick={()=>unmarkDay(h.id)}>Undo</button>
          <button onClick={()=>deleteHabit(h.id)}>Delete</button>
        </div>
      ))}

    </div>
  );
}

const styles = {
  container:{padding:20},
  dateRow:{display:"flex",gap:8},
  dateCard:{padding:10,cursor:"pointer"},
  createCard:{padding:20,background:"#111",color:"#fff",cursor:"pointer"},
  card:{padding:16,borderRadius:16,color:"#fff",margin:10}
};