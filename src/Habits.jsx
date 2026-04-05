import { useState, useMemo } from "react";

export default function Habits({ items = [], setItems }) {

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const [name, setName] = useState("");
  const [time, setTime] = useState(""); // ⏰ NEW
  const [view, setView] = useState("today");
  const [weekOffset, setWeekOffset] = useState(0);

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const todayKey = getKey(new Date());

  // ===== ADD =====
  const addHabit = () => {
    if (!name.trim()) return;

    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        type: "habit",
        completed: {},
        xp: 0,
        time: time || null // ⏰ NEW
      }
    ]);

    setName("");
    setTime("");
  };

  // ===== DELETE =====
  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ===== WEEK =====
  const week = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { label: d.getDate(), key: getKey(d) };
    });
  }, [weekOffset]);

  const getWeekRange = () =>
    `${week[0].label} - ${week[6].label}`;

  // ===== TOGGLE =====
  const toggleDay = (id, key) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const updated = { ...(item.completed || {}) };
        const already = updated[key];

        updated[key] = !updated[key];

        return {
          ...item,
          completed: updated,
          xp: already
            ? Math.max(0, item.xp - 10)
            : item.xp + 10
        };
      })
    );
  };

  // ===== TIME CHECK =====
  const isDueNow = (habit) => {
    if (!habit.time) return false;

    const now = new Date();
    const [h, m] = habit.time.split(":");

    return (
      now.getHours() >= Number(h) &&
      now.getMinutes() >= Number(m)
    );
  };

  // ===== DASHBOARD =====
  const totalXP = habits.reduce((s, h) => s + (h.xp || 0), 0);

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* VIEW TOGGLE */}
      <div style={styles.toggle}>
        <button onClick={() => setView("today")}>Today</button>
        <button onClick={() => setView("week")}>Week</button>
      </div>

      {/* DASHBOARD */}
      <div style={styles.dashboard}>
        <div>⭐ XP: {totalXP}</div>
        <div>📊 Habits: {habits.length}</div>
      </div>

      {/* NAV */}
      {view === "week" && (
        <div style={styles.nav}>
          <button onClick={() => setWeekOffset(p => p - 1)}>⬅</button>
          <span>{getWeekRange()}</span>
          <button onClick={() => setWeekOffset(p => p + 1)}>➡</button>
        </div>
      )}

      {/* ADD */}
      <div style={styles.addBox}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name"
          style={styles.input}
        />

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={styles.input}
        />

        <button onClick={addHabit} style={styles.addBtn}>
          Add
        </button>
      </div>

      {/* TODAY VIEW */}
      {view === "today" && habits.map(h => {
        const done = h.completed?.[todayKey];
        const due = isDueNow(h);

        return (
          <div key={h.id} style={styles.card}>

            <div style={styles.row}>
              <h3>{h.name}</h3>
              {h.time && <span>⏰ {h.time}</span>}
            </div>

            {/* STATUS */}
            <div style={styles.status}>
              {done && "✅ Completed"}
              {!done && due && "⚠️ Due now"}
              {!done && !due && "🕒 Upcoming"}
            </div>

            <button
              onClick={() => toggleDay(h.id, todayKey)}
              style={{
                ...styles.todayBtn,
                background: done
                  ? "var(--accent)"
                  : "var(--card)"
              }}
            >
              {done ? "Completed ✔" : "Mark Done"}
            </button>

            <button
              onClick={() => deleteHabit(h.id)}
              style={styles.delete}
            >
              Delete
            </button>

          </div>
        );
      })}

      {/* WEEK VIEW */}
      {view === "week" && habits.map(h => (
        <div key={h.id} style={styles.card}>
          <h3>{h.name}</h3>

          <div style={styles.week}>
            {week.map(d => (
              <div
                key={d.key}
                onClick={() => toggleDay(h.id, d.key)}
                style={{
                  ...styles.day,
                  background: h.completed?.[d.key]
                    ? "var(--accent)"
                    : "var(--card)"
                }}
              />
            ))}
          </div>
        </div>
      ))}

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: { padding: 20, color: "var(--text)" },
  title: { fontSize: 26 },

  toggle: { display: "flex", gap: 10, marginBottom: 10 },

  dashboard: { display: "flex", gap: 20, marginBottom: 15 },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10
  },

  addBox: { display: "flex", gap: 10, marginBottom: 20 },

  input: {
    padding: 10,
    background: "var(--card)",
    color: "var(--text)"
  },

  addBtn: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    padding: 10
  },

  card: {
    background: "var(--card)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },

  row: {
    display: "flex",
    justifyContent: "space-between"
  },

  status: {
    marginTop: 6,
    color: "var(--text-muted)"
  },

  todayBtn: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8
  },

  delete: {
    marginTop: 10,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: 8
  },

  week: { display: "flex", gap: 6, marginTop: 10 },

  day: {
    width: 30,
    height: 30,
    borderRadius: 6,
    cursor: "pointer"
  }
};