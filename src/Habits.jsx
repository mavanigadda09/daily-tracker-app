import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/* ===== DATE UTILS ===== */
const getKey = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const todayKey = () => getKey(new Date());

export default function Habits({ items = [], setItems }) {
  const hydrated = useRef(false);

  /* ================= LOCAL STORAGE ================= */
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

  /* ================= STATE ================= */
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [targetDays, setTargetDays] = useState(30);
  const [tip, setTip] = useState("");

  const [view, setView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeKey = getKey(selectedDate);

  const dayNames = ["S","M","T","W","T","F","S"];

  /* ================= DATES ================= */
  const dates = useMemo(() => {
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
  }, [view]);

  /* ================= SUMMARY ================= */
  const completedHabits = habits.filter(
    h => h.completed?.[activeKey]?.done
  );

  const pendingHabits = habits.filter(
    h => !h.completed?.[activeKey]?.done
  );

  const completionRate = habits.length
    ? Math.round((completedHabits.length / habits.length) * 100)
    : 0;

  const totalXP = habits.reduce((sum, h) => sum + (h.xp || 0), 0);

  const bestStreak = Math.max(
    ...habits.map(h => h.bestStreak || 0),
    0
  );

  /* ================= ADD / EDIT ================= */
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

  /* ================= TOGGLE ================= */
  const toggleDay = (id) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };

        if (completed[activeKey]?.done) return item;

        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = getKey(yesterday);

        const newStreak = completed[yKey]?.done
          ? item.streak + 1
          : 1;

        return {
          ...item,
          completed: {
            ...completed,
            [activeKey]: {
              done: true,
              note: ""
            }
          },
          xp: item.xp + 10,
          streak: newStreak,
          bestStreak: Math.max(item.bestStreak || 0, newStreak)
        };
      })
    );
  };

  const addNote = (id, note) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              completed: {
                ...item.completed,
                [activeKey]: {
                  ...(item.completed?.[activeKey] || {}),
                  note
                }
              }
            }
          : item
      )
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
    setTip(h.tip || "");
    setEditId(h.id);
    setShowForm(true);
  };

  /* ================= UI ================= */
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔥 Habits</h1>

      {/* SUMMARY */}
      <div style={styles.summary}>
        <div>🔥 {completedHabits.length}/{habits.length}</div>
        <div>⚡ XP: {totalXP}</div>
        <div>📊 {completionRate}%</div>
        <div>🏆 Best: {bestStreak}</div>
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        {["today","week","month"].map(v => (
          <button key={v} onClick={()=>setView(v)} style={{
            ...styles.tab,
            ...(view===v?styles.activeTab:{})
          }}>
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* DATE */}
      <div style={view==="month"?styles.monthGrid:styles.dateRow}>
        {dates.map((d,i)=>{
          const key = getKey(d);
          const active = key === activeKey;

          return (
            <div key={i}
              onClick={()=>setSelectedDate(d)}
              style={{
                ...styles.dateCard,
                background: active ? "#facc15" : "#111",
                color: active ? "#000" : "#fff"
              }}
            >
              <div>{d.getDate()}</div>
              <div style={{fontSize:10}}>
                {dayNames[d.getDay()]}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE */}
      {!showForm && (
        <div style={styles.createCard} onClick={()=>setShowForm(true)}>
          ➕ Create Habit
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input placeholder="Habit Name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Tip / Instruction" value={tip} onChange={e=>setTip(e.target.value)} />
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
          <input type="number" value={targetDays} onChange={e=>setTargetDays(e.target.value)} />
          <button type="submit">Save</button>
          <button type="button" onClick={()=>setShowForm(false)}>Cancel</button>
        </form>
      )}

      {/* PENDING */}
      <h3>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h,i)=>{
          const progress = Math.min(
            Math.round((h.streak/(h.targetDays||30))*100),
            100
          );

          return (
            <motion.div key={h.id} style={{...styles.card, background:colors[i%4]}}>
              <h3>{h.name}</h3>

              {h.tip && <p>💡 {h.tip}</p>}

              <p>🔥 {h.streak} | ⚡ {h.xp}</p>

              <div style={styles.progressBar}>
                <div style={{...styles.progressFill,width:`${progress}%`}}/>
              </div>

              <button onClick={()=>toggleDay(h.id)}>Done</button>
            </motion.div>
          );
        })}
      </div>

      {/* COMPLETED */}
      <h3>Completed</h3>
      <div style={styles.grid}>
        {completedHabits.map((h,i)=>{
          const note = h.completed?.[activeKey]?.note || "";

          return (
            <div key={h.id} style={{...styles.card, opacity:0.7}}>
              <h3>{h.name}</h3>

              <textarea
                placeholder="Reflection..."
                value={note}
                onChange={(e)=>addNote(h.id,e.target.value)}
              />

              <button onClick={()=>unmarkDay(h.id)}>Undo</button>
              <button onClick={()=>deleteHabit(h.id)}>Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== COLORS ===== */
const colors = [
  "linear-gradient(135deg,#facc15,#f97316)",
  "linear-gradient(135deg,#f97316,#ef4444)",
  "linear-gradient(135deg,#facc15,#ef4444)",
  "linear-gradient(135deg,#fb923c,#facc15)"
];

/* ===== STYLES ===== */
const styles = {
  container:{padding:24,maxWidth:1000,margin:"0 auto",color:"#fff"},
  title:{color:"#facc15"},
  summary:{display:"flex",gap:20,marginBottom:20},

  tabs:{display:"flex",gap:10,marginBottom:10},
  tab:{padding:8},
  activeTab:{background:"#facc15",color:"#000"},

  dateRow:{display:"flex",gap:8,overflowX:"auto"},
  monthGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8},

  dateCard:{padding:10,cursor:"pointer",textAlign:"center"},

  createCard:{padding:20,background:"#111",marginBottom:20,cursor:"pointer"},

  form:{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"},

  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16},

  card:{padding:16,borderRadius:12},

  progressBar:{height:6,background:"#333",margin:"10px 0"},
  progressFill:{height:6,background:"#facc15"}
};