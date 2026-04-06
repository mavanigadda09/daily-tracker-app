import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// ===== DATE UTILS =====
const getKey = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export default function Habits({ items = [], setItems }) {

  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      const saved = localStorage.getItem("habits");
      if (saved && items.length === 0) {
        setItems(JSON.parse(saved));
      }
      hydrated.current = true;
    }
  }, [items, setItems]);

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
  const [tip, setTip] = useState("");

  const [view, setView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeKey = getKey(selectedDate);

  // ===== SUMMARY =====
  const completedToday = habits.filter(
    h => h.completed?.[activeKey]?.done
  ).length;

  const totalXP = habits.reduce((sum, h) => sum + (h.xp || 0), 0);

  const completionRate = habits.length
    ? Math.round((completedToday / habits.length) * 100)
    : 0;

  // ===== ADD / EDIT =====
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editId) {
      setItems(prev =>
        prev.map(i =>
          i.id === editId
            ? { ...i, name, time, targetDays: Number(targetDays), tip }
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
          targetDays: Number(targetDays),
          tip
        }
      ]);
    }

    setName("");
    setTime("");
    setTargetDays(30);
    setTip("");
    setShowForm(false);
    setEditId(null);
  };

  // ===== TOGGLE =====
  const toggleDay = (id) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };

        if (completed[activeKey]?.done) return item;

        return {
          ...item,
          completed: {
            ...completed,
            [activeKey]: {
              done: true,
              note: "",
              value: 1
            }
          },
          xp: item.xp + 10,
          streak: item.streak + 1,
          bestStreak: Math.max(item.bestStreak || 0, item.streak + 1)
        };
      })
    );
  };

  const addNote = (id, note) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        return {
          ...item,
          completed: {
            ...item.completed,
            [activeKey]: {
              ...(item.completed?.[activeKey] || {}),
              note
            }
          }
        };
      })
    );
  };

  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ===== UI =====
  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* 🔥 SUMMARY */}
      <div style={styles.summary}>
        <div>🔥 {completedToday}/{habits.length} done</div>
        <div>⚡ XP: {totalXP}</div>
        <div>📊 {completionRate}%</div>
      </div>

      {/* CREATE */}
      {!showForm && (
        <div style={styles.createCard} onClick={()=>setShowForm(true)}>
          ➕ Create Habit
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input placeholder="Habit name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Tip" value={tip} onChange={e=>setTip(e.target.value)} />
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
          <input type="number" value={targetDays} onChange={e=>setTargetDays(e.target.value)} />

          <button type="submit">Add</button>
          <button type="button" onClick={()=>setShowForm(false)}>Close</button>
        </form>
      )}

      {/* HABITS */}
      <div style={styles.grid}>
        {habits.map((h,i)=>{

          const done = h.completed?.[activeKey]?.done;
          const note = h.completed?.[activeKey]?.note || "";

          const progress = Math.min(
            Math.round((h.streak / (h.targetDays || 30)) * 100),
            100
          );

          return (
            <motion.div key={h.id} style={styles.card}>

              <h3>{h.name}</h3>

              {h.tip && <p style={styles.tip}>💡 {h.tip}</p>}

              <p>🔥 {h.streak}</p>
              <p>⚡ {h.xp}</p>

              {/* 🔥 PROGRESS */}
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width:`${progress}%`}} />
              </div>

              {/* ACTION */}
              {!done && (
                <button onClick={()=>toggleDay(h.id)}>
                  Done
                </button>
              )}

              {/* NOTE */}
              {done && (
                <textarea
                  placeholder="Daily reflection..."
                  value={note}
                  onChange={(e)=>addNote(h.id, e.target.value)}
                  style={styles.note}
                />
              )}

              <button onClick={()=>deleteHabit(h.id)}>Delete</button>

            </motion.div>
          );
        })}
      </div>

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container:{padding:20,color:"#fff"},
  title:{color:"#facc15"},
  summary:{
    display:"flex",
    gap:20,
    marginBottom:20
  },
  createCard:{
    padding:20,
    background:"#111",
    marginBottom:20,
    cursor:"pointer"
  },
  form:{
    display:"flex",
    gap:10,
    marginBottom:20
  },
  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",
    gap:16
  },
  card:{
    padding:16,
    background:"#111",
    borderRadius:12
  },
  tip:{
    fontSize:12,
    opacity:0.7
  },
  progressBar:{
    height:6,
    background:"#333",
    borderRadius:6,
    margin:"10px 0"
  },
  progressFill:{
    height:6,
    background:"#facc15",
    borderRadius:6
  },
  note:{
    width:"100%",
    marginTop:10
  }
};