import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function Habits({ items = [], setItems }) {

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

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const activeKey = getKey(selectedDate);

  const dayNames = ["S","M","T","W","T","F","S"];

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

    // ✅ FULL MONTH GRID (NO SLIDE)
    const year = today.getFullYear();
    const month = today.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: days }, (_, i) =>
      new Date(year, month, i + 1)
    );
  };

  const dates = getDates();

  // ===== FILTER =====
  const isCompleted = (habit) => habit.completed?.[activeKey];

  const completedHabits = habits.filter(h => isCompleted(h));
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
      // ✅ FULL EDIT
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

  // ===== TOGGLE =====
  const toggleDay = (id, key) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };

        if (completed[key]) {
          delete completed[key];
          return { ...item, completed };
        }

        completed[key] = true;

        return {
          ...item,
          completed,
          xp: item.xp + 10,
          streak: item.streak + 1
        };
      })
    );
  };

  const unmarkDay = (id, key) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const completed = { ...(item.completed || {}) };
        delete completed[key];

        return { ...item, completed };
      })
    );
  };

  // ✅ FIXED DELETE BUG
  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ✅ EDIT LOAD
  const editHabit = (habit) => {
    setName(habit.name);
    setTime(habit.time);
    setTargetDays(habit.targetDays);
    setEditId(habit.id);
    setShowForm(true);
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>
      <h2 style={styles.progressText}>{completionRate}% completed today</h2>

      {/* VIEW */}
      <div style={styles.tabs}>
        {["today","week","month"].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              ...styles.tab,
              ...(view === v ? styles.activeTab : {})
            }}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* DATE */}
      <div style={{
        ...styles.dateRow,
        flexWrap: view === "month" ? "wrap" : "nowrap",
        overflowX: view === "month" ? "hidden" : "auto"
      }}>
        {dates.map((d,i)=>{
          const key = getKey(d);
          const active = key === activeKey;

          return (
            <div
              key={i}
              onClick={()=>setSelectedDate(d)}
              style={{
                ...styles.dateCard,
                background: active ? "#ef4444" : "var(--card-bg)",
                color: "var(--text-color)"
              }}
            >
              {d.getDate()}
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

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.horizontalForm}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Habit" style={styles.input}/>
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

      {/* PENDING */}
      <h3>Pending</h3>
      <div style={styles.grid}>
        {pendingHabits.map((h,i)=>{
          const bg = colors[i%colors.length];

          return (
            <motion.div key={h.id} style={{...styles.card, background:bg}}>
              <div style={styles.cardTop}>
                <h3>{h.name}</h3>
                <div>
                  <button onClick={()=>editHabit(h)}>🖊</button>
                  <button onClick={()=>deleteHabit(h.id)}>🗑</button>
                </div>
              </div>

              <p>🔥 {h.streak} day</p>
              <p>⚡ {h.xp} XP</p>

              <button onClick={()=>toggleDay(h.id,activeKey)} style={styles.actionBtn}>
                Mark Done
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* COMPLETED */}
      <h3>Completed</h3>
      <div style={styles.grid}>
        {completedHabits.map((h,i)=>{
          const bg = colors[i%colors.length];

          return (
            <div key={h.id} style={{...styles.card, background:bg}}>
              <h3>{h.name}</h3>

              <button onClick={()=>unmarkDay(h.id,activeKey)} style={styles.unmarkBtn}>
                Undo
              </button>

              <button onClick={()=>deleteHabit(h.id)}>🗑</button>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ===== STYLES (AUTO DARK SUPPORT) =====
const styles = {
  container: {
    padding: 24,
    maxWidth: 1000,
    margin: "0 auto",
    color: "var(--text-color)"
  },

  title: { fontSize: 28 },
  progressText: { opacity: 0.7 },

  tabs: {
    display: "flex",
    gap: 10,
    background: "#0f172a",
    padding: 6,
    borderRadius: 12
  },

  tab: {
    padding: 10,
    borderRadius: 8,
    color: "#94a3b8",
    background: "transparent",
    border: "none"
  },

  activeTab: {
    background: "#22c55e",
    color: "#fff"
  },

  dateRow: {
    display: "flex",
    gap: 8,
    margin: "20px 0"
  },

  dateCard: {
    padding: 10,
    borderRadius: 10,
    minWidth: 45,
    textAlign: "center",
    cursor: "pointer"
  },

  createCard: {
    padding: 20,
    background: "#111",
    color: "#fff",
    borderRadius: 16,
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 20
  },

  horizontalForm: {
    display: "flex",
    gap: 10,
    marginBottom: 20
  },

  input: {
    padding: 10,
    borderRadius: 10
  },

  addBtn: {
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: 10
  },

  closeBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: 10
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
    gap: 16
  },

  card: {
    padding: 16,
    borderRadius: 20,
    color: "#fff"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between"
  },

  actionBtn: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    background: "#fff"
  },

  unmarkBtn: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    background: "#fff"
  }
};