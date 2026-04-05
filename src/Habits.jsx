import { useState, useMemo } from "react";

export default function Habits({ items = [], setItems }) {

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const [name, setName] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

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
        xp: 0
      }
    ]);

    setName("");
  };

  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  // ===== WEEK =====
  const week = useMemo(() => {
    const today = new Date();
    const day = today.getDay();

    const start = new Date(today);
    start.setDate(today.getDate() - day + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return {
        label: d.getDate(),
        key: getKey(d)
      };
    });
  }, [weekOffset]);

  // ===== TOGGLE + XP =====
  const toggleDay = (id, key) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const updated = { ...(item.completed || {}) };
        const alreadyDone = updated[key];

        updated[key] = !updated[key];

        return {
          ...item,
          completed: updated,
          xp: alreadyDone
            ? Math.max(0, item.xp - 10)
            : item.xp + 10
        };
      })
    );
  };

  // ===== STREAK =====
  const getStreak = (habit) => {
    const completed = habit.completed || {};
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getKey(d);

      if (completed[key]) streak++;
      else break;
    }

    return streak;
  };

  // ===== LEVEL =====
  const getLevel = (xp) => {
    if (xp >= 500) return 5;
    if (xp >= 250) return 4;
    if (xp >= 100) return 3;
    if (xp >= 50) return 2;
    return 1;
  };

  // ===== BADGE =====
  const getBadge = (streak) => {
    if (streak >= 30) return "🥇 Gold";
    if (streak >= 14) return "🥈 Silver";
    if (streak >= 7) return "🥉 Bronze";
    return "—";
  };

  const getWeeklyProgress = (habit) => {
    const completed = habit.completed || {};
    const done = week.filter(d => completed[d.key]).length;
    return Math.round((done / 7) * 100);
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits</h1>

      {/* NAV */}
      <div style={styles.nav}>
        <button onClick={() => setWeekOffset(p => p - 1)}>⬅</button>
        <button onClick={() => setWeekOffset(0)}>Today</button>
        <button onClick={() => setWeekOffset(p => p + 1)}>➡</button>
      </div>

      {/* ADD */}
      <div style={styles.addBox}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New Habit"
          style={styles.input}
        />
        <button onClick={addHabit} style={styles.addBtn}>
          Add
        </button>
      </div>

      {habits.length === 0 && (
        <p style={styles.empty}>No habits yet 🚀</p>
      )}

      {/* HABITS */}
      <div style={styles.list}>
        {habits.map((h) => {
          const completed = h.completed || {};
          const streak = getStreak(h);
          const progress = getWeeklyProgress(h);
          const level = getLevel(h.xp || 0);
          const badge = getBadge(streak);

          return (
            <div
              key={h.id}
              style={styles.card}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.01)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >

              {/* HEADER */}
              <div style={styles.header}>
                <h3>{h.name}</h3>
                <button onClick={() => deleteHabit(h.id)}>❌</button>
              </div>

              {/* STATS */}
              <div style={styles.stats}>
                <span>🔥 {streak}</span>
                <span>⭐ {h.xp || 0} XP</span>
                <span>🆙 Lv {level}</span>
                <span>{badge}</span>
              </div>

              {/* PROGRESS */}
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progress}%`
                  }}
                />
              </div>

              {/* WEEK */}
              <div style={styles.week}>
                {week.map((d) => (
                  <div
                    key={d.key}
                    onClick={() => toggleDay(h.id, d.key)}
                    style={{
                      ...styles.day,
                      background: completed[d.key]
                        ? "var(--accent)"
                        : "var(--card)",
                      color: completed[d.key]
                        ? "#fff"
                        : "var(--text)"
                    }}
                  >
                    {completed[d.key] ? "✔" : ""}
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: {
    padding: 20,
    color: "var(--text)"
  },

  title: {
    fontSize: 26
  },

  nav: {
    display: "flex",
    gap: 10,
    marginBottom: 10
  },

  addBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20
  },

  input: {
    flex: 1,
    padding: 12,
    background: "var(--card)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10
  },

  addBtn: {
    background: "var(--accent)",
    border: "none",
    padding: "12px 16px",
    color: "#fff",
    borderRadius: 10,
    cursor: "pointer"
  },

  empty: {
    color: "var(--text-muted)"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16
  },

  card: {
    background: "var(--card)",
    padding: 18,
    borderRadius: 16,
    border: "1px solid var(--border)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    transition: "0.2s ease"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  stats: {
    display: "flex",
    gap: 14,
    marginTop: 10,
    flexWrap: "wrap",
    color: "var(--text-muted)"
  },

  progressBar: {
    height: 8,
    background: "var(--border)",
    marginTop: 12,
    borderRadius: 10,
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: "var(--accent)",
    borderRadius: 10,
    transition: "0.3s ease"
  },

  week: {
    display: "flex",
    gap: 8,
    marginTop: 14
  },

  day: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    border: "1px solid var(--border)",
    transition: "0.2s ease"
  }
};