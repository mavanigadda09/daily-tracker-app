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

  const [view, setView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeKey = getKey(selectedDate);
  const dayNames = ["S","M","T","W","T","F","S"];

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

  const isCompleted = (habit) =>
    habit.completed?.[activeKey]?.done;

  const completedHabits = habits.filter(isCompleted);
  const pendingHabits = habits.filter(h => !isCompleted(h));

  const completionRate = habits.length
    ? Math.round((completedHabits.length / habits.length) * 100)
    : 0;

  // 🔥 PHOENIX COLORS
  const colors = [
    "linear-gradient(135deg,#facc15,#f97316)",
    "linear-gradient(135deg,#f97316,#ef4444)",
    "linear-gradient(135deg,#facc15,#ef4444)",
    "linear-gradient(135deg,#fb923c,#facc15)"
  ];

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

      <h1 style={styles.title}>🔥 Habits</h1>
      <h2 style={styles.progressText}>{completionRate}% completed today</h2>

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

      <div style={view === "month" ? styles.monthGrid : styles.dateRow}>
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

      {!showForm && (
        <div style={styles.createCard} onClick={()=>setShowForm(true)}>
          ➕ Create Habit
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.horizontalForm}>
          <input value={name} onChange={e=>setName(e.target.value)} style={styles.input}/>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={styles.input}/>
          <input type="number" value={targetDays} onChange={e=>setTargetDays(e.target.value)} style={styles.input}/>

          <button type="submit" style={styles.addBtn}>
            {editId ? "Update" : "Add"}
          </button>

          <button type="button" onClick={resetForm} style={styles.closeBtn}>
            Close
          </button>
        </form>
      )}

      <h3 style={styles.section}>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h,i)=>(
          <motion.div
            key={h.id}
            whileHover={{ scale: 1.03 }}
            style={{...styles.card, background:colors[i%4]}}
          >
            <div style={styles.cardTop}>
              <h3>{h.name}</h3>
              <div>
                <button onClick={()=>editHabit(h)}>✏️</button>
                <button onClick={()=>deleteHabit(h.id)}>🗑</button>
              </div>
            </div>

            <p>🔥 {h.streak}</p>
            <p>🏆 Best: {h.bestStreak || 0}</p>
            <p>⚡ {h.xp}</p>

            <button onClick={()=>toggleDay(h.id)} style={styles.actionBtn}>
              Done
            </button>
          </motion.div>
        ))}
      </div>

      <h3 style={styles.section}>Completed</h3>
      <div style={styles.grid}>
        {completedHabits.map((h,i)=>(
          <div key={h.id} style={{...styles.card, background:colors[i%4], opacity:0.7}}>
            <h3>{h.name}</h3>

            <button onClick={()=>unmarkDay(h.id)} style={styles.unmarkBtn}>
              Undo
            </button>

            <button onClick={()=>deleteHabit(h.id)}>🗑</button>
          </div>
        ))}
      </div>

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container:{padding:24,maxWidth:1000,margin:"0 auto"},
  title:{
    fontSize:28,
    color:"#facc15",
    textShadow:"0 0 10px #facc15"
  },
  progressText:{opacity:0.7},

  section:{marginTop:20},

  tabs:{
    display:"flex",
    gap:10,
    background:"#020617",
    padding:6,
    borderRadius:12
  },

  tab:{
    padding:10,
    borderRadius:8,
    color:"#94a3b8",
    border:"none",
    background:"transparent"
  },

  activeTab:{
    background:"#facc15",
    color:"#000"
  },

  dateRow:{
    display:"flex",
    gap:8,
    margin:"20px 0",
    overflowX:"auto"
  },

  monthGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(10, 1fr)",
    gap:8,
    margin:"20px 0"
  },

  dateCard:{
    padding:10,
    borderRadius:10,
    minWidth:45,
    textAlign:"center",
    cursor:"pointer"
  },

  createCard:{
    padding:20,
    background:"#111",
    color:"#fff",
    borderRadius:16,
    textAlign:"center",
    cursor:"pointer",
    marginBottom:20,
    boxShadow:"0 0 10px rgba(250,204,21,0.3)"
  },

  horizontalForm:{
    display:"flex",
    gap:10,
    marginBottom:20
  },

  input:{
    padding:10,
    borderRadius:10
  },

  addBtn:{
    background:"#facc15",
    color:"#000",
    borderRadius:10,
    padding:10
  },

  closeBtn:{
    background:"#ef4444",
    color:"#fff",
    borderRadius:10,
    padding:10
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",
    gap:16
  },

  card:{
    padding:16,
    borderRadius:20,
    color:"#fff",
    boxShadow:"0 0 15px rgba(250,204,21,0.3)"
  },

  cardTop:{
    display:"flex",
    justifyContent:"space-between"
  },

  actionBtn:{
    marginTop:10,
    padding:10,
    borderRadius:10,
    background:"#fff"
  },

  unmarkBtn:{
    marginTop:10,
    padding:8,
    borderRadius:8,
    background:"#fff"
  }
};