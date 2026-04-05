import { useState, useMemo } from "react";

export default function Habits({ items = [], setItems }) {

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [targetDays, setTargetDays] = useState(30);
  const [view, setView] = useState("today");
  const [weekOffset, setWeekOffset] = useState(0);

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  const today = new Date();
  const todayKey = getKey(today);

  // ===== ADD (ENTER SUPPORT) =====
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
        time: time || null,
        targetDays: Number(targetDays),
        createdAt: Date.now()
      }
    ]);

    setName("");
    setTime("");
    setTargetDays(30);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") addHabit();
  };

  // ===== DELETE =====
  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ===== WEEK =====
  const week = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { key: getKey(d), date: d };
    });
  }, [weekOffset]);

  const getWeekRange = () =>
    `${week[0].date.getDate()} - ${week[6].date.getDate()}`;

  // ===== MONTH =====
  const getMonthDays = () => {
    const days = [];
    const now = new Date();

    const total = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

    for (let i = 1; i <= total; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      days.push(getKey(d));
    }

    return days;
  };

  // ===== TOGGLE (ONLY TODAY ALLOWED) =====
  const toggleDay = (id, key) => {
    if (key !== todayKey) return; // 🔒 restrict

    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const updated = { ...(item.completed || {}) };
        updated[key] = !updated[key];

        return {
          ...item,
          completed: updated
        };
      })
    );
  };

  // ===== PROGRESS =====
  const getProgress = (habit) => {
    const total = habit.targetDays || 30;
    const done = Object.keys(habit.completed || {}).length;

    return {
      percent: Math.min(100, Math.round((done / total) * 100)),
      done,
      total
    };
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* TOGGLE */}
      <div style={styles.toggle}>
        <button onClick={() => setView("today")}>Today</button>
        <button onClick={() => setView("week")}>Week</button>
        <button onClick={() => setView("month")}>Month</button>
      </div>

      {/* ADD */}
      <div style={styles.addBox}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Habit name"
          style={styles.input}
        />

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onKeyDown={handleEnter}
          style={styles.input}
        />

        <input
          type="number"
          value={targetDays}
          onChange={(e) => setTargetDays(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Days"
          style={styles.input}
        />

        <button onClick={addHabit} style={styles.addBtn}>
          Add
        </button>
      </div>

      {/* WEEK NAV */}
      {view === "week" && (
        <div style={styles.nav}>
          <button onClick={() => setWeekOffset(p => p - 1)}>⬅</button>
          <span>{getWeekRange()}</span>
          <button onClick={() => setWeekOffset(p => p + 1)}>➡</button>
        </div>
      )}

      {/* HABITS */}
      {habits.map(h => {
        const progress = getProgress(h);

        return (
          <div key={h.id} style={styles.card}>

            <div style={styles.header}>
              <h3>{h.name}</h3>
              {h.time && <span>⏰ {h.time}</span>}
            </div>

            {/* PROGRESS */}
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progress.percent}%`
                }}
              />
            </div>

            <div style={styles.meta}>
              {progress.done} / {progress.total} days
            </div>

            {/* TODAY */}
            {view === "today" && (
              <button
                onClick={() => toggleDay(h.id, todayKey)}
                style={{
                  ...styles.todayBtn,
                  background: h.completed?.[todayKey]
                    ? "var(--accent)"
                    : "var(--card)"
                }}
              >
                {h.completed?.[todayKey]
                  ? "Completed ✔"
                  : "Mark Done"}
              </button>
            )}

            {/* WEEK */}
            {view === "week" && (
              <div style={styles.week}>
                {week.map(d => (
                  <div
                    key={d.key}
                    style={{
                      ...styles.day,
                      opacity: d.key !== todayKey ? 0.4 : 1,
                      background: h.completed?.[d.key]
                        ? "var(--accent)"
                        : "var(--card)"
                    }}
                  />
                ))}
              </div>
            )}

            {/* MONTH */}
            {view === "month" && (
              <div style={styles.month}>
                {getMonthDays().map(key => (
                  <div
                    key={key}
                    style={{
                      ...styles.day,
                      background: h.completed?.[key]
                        ? "var(--accent)"
                        : "var(--card)"
                    }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => deleteHabit(h.id)}
              style={styles.delete}
            >
              Delete
            </button>

          </div>
        );
      })}

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: {
    padding: 24,
    maxWidth: 900,
    margin: "0 auto",
    color: "var(--text)"
  },

  title: { fontSize: 28, marginBottom: 10 },

  toggle: { display: "flex", gap: 10, marginBottom: 20 },

  addBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)"
  },

  addBtn: {
    background: "var(--accent)",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: 8
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  card: {
    padding: 20,
    borderRadius: 16,
    background: "var(--card)",
    marginBottom: 20,
    border: "1px solid var(--border)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between"
  },

  progressBar: {
    height: 8,
    background: "var(--border)",
    marginTop: 10,
    borderRadius: 10
  },

  progressFill: {
    height: "100%",
    background: "var(--accent)",
    borderRadius: 10
  },

  meta: {
    marginTop: 6,
    color: "var(--text-muted)"
  },

  todayBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    border: "1px solid var(--border)"
  },

  week: {
    display: "flex",
    gap: 6,
    marginTop: 10
  },

  month: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
    marginTop: 10
  },

  day: {
    width: 28,
    height: 28,
    borderRadius: 6
  },

  delete: {
    marginTop: 10,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: 8,
    borderRadius: 6
  }
};