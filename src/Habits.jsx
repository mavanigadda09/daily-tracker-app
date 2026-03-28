import { useState } from "react";

export default function Habits({ items, setItems }) {

  // ================= FILTER =================
  const habits = items.filter(i => i.type === "habit");

  // ================= STATE =================
  const [name, setName] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  // ================= ADD HABIT =================
  const addHabit = () => {
    if (!name.trim()) return;

    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        name: name.trim(),
        type: "habit",
        completed: {}
      }
    ]);

    setName("");
  };

  // ================= DATE KEY =================
  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  // ================= WEEK =================
  const getWeek = () => {
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
  };

  const week = getWeek();

  // ================= LAST 30 =================
  const getLast30Days = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return getKey(d);
    });
  };

  const last30 = getLast30Days();

  // ================= TOGGLE =================
  const toggleDay = (id, key) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const updated = { ...(item.completed || {}) };
        updated[key] = !updated[key];

        return { ...item, completed: updated };
      })
    );
  };

  // ================= STREAK =================
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

  // ================= BEST STREAK =================
  const getBestStreak = (habit) => {
    const completed = habit.completed || {};
    const dates = Object.keys(completed).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    let best = 0;
    let current = 0;
    let prev = null;

    dates.forEach((k) => {
      if (!completed[k]) return;

      const d = new Date(k);

      if (prev) {
        const diff = (d - prev) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 1;
      }

      best = Math.max(best, current);
      prev = d;
    });

    return best;
  };

  // ================= UI =================
  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits Tracker</h1>

      {/* NAV */}
      <div style={styles.navRow}>
        <button onClick={() => setWeekOffset(p => p - 1)} style={styles.navBtn}>⬅</button>
        <button onClick={() => setWeekOffset(0)} style={styles.todayBtn}>Today</button>
        <button onClick={() => setWeekOffset(p => p + 1)} style={styles.navBtn}>➡</button>
      </div>

      {/* ADD HABIT */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="New Habit"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button style={styles.btn} onClick={addHabit}>Add Habit</button>
      </div>

      {/* EMPTY STATE */}
      {habits.length === 0 && (
        <p style={{ color: "#64748b", marginTop: 20 }}>
          No habits yet. Add one above 👆
        </p>
      )}

      {/* GRID */}
      <div style={{ overflowX: "auto" }}>
        <div style={styles.grid}>

          <div>Habit</div>

          {week.map((d, i) => (
            <div key={d.key} style={styles.headerCell}>
              {["S","M","T","W","T","F","S"][i]}<br/>
              {d.label}
            </div>
          ))}

          <div>🔥</div>
          <div>🏆</div>

          {habits.map((h) => {
            const completed = h.completed || {};
            const streak = getStreak(h);

            return (
              <div key={h.id} style={{ display: "contents" }}>

                {/* NAME */}
                <div style={styles.habit}>{h.name}</div>

                {/* DAYS */}
                {week.map((d) => (
                  <div
                    key={d.key}
                    onClick={() => toggleDay(h.id, d.key)}
                    style={{
                      ...styles.cell,
                      background: completed[d.key] ? "#22c55e" : "#020617"
                    }}
                  >
                    {completed[d.key] ? "✔" : ""}
                  </div>
                ))}

                {/* STREAK */}
                <div style={styles.streak}>
                  {streak} 🔥
                </div>

                {/* BEST */}
                <div style={styles.best}>
                  🏆 {getBestStreak(h)}
                </div>

                {/* HEATMAP */}
                <div style={styles.heatmap}>
                  {last30.map((k) => (
                    <div
                      key={k}
                      style={{
                        ...styles.heatCell,
                        background: completed[k]
                          ? "#16a34a"
                          : "#1e293b"
                      }}
                    />
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ================= STYLES =================

const styles = {
  container: { padding: 30, color: "#fff" },

  title: { fontSize: 28, marginBottom: 20 },

  navRow: { display: "flex", gap: 10 },

  navBtn: {
    background: "#334155",
    color: "#fff",
    padding: 8,
    borderRadius: 8,
    border: "none",
    cursor: "pointer"
  },

  todayBtn: {
    background: "#22c55e",
    padding: 8,
    borderRadius: 8,
    border: "none",
    cursor: "pointer"
  },

  card: {
    display: "flex",
    gap: 10,
    marginTop: 20,
    background: "linear-gradient(145deg, #0f172a, #020617)",
    padding: 15,
    borderRadius: 12
  },

  input: {
    padding: 10,
    background: "#020617",
    border: "1px solid #334155",
    color: "#fff",
    borderRadius: 8,
    flex: 1
  },

  btn: {
    background: "#6366f1",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    border: "none",
    cursor: "pointer"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "150px repeat(7, 50px) 70px 80px",
    gap: 10,
    marginTop: 20
  },

  headerCell: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8"
  },

  habit: {
    fontWeight: "bold"
  },

  cell: {
    height: 40,
    width: 40,
    borderRadius: 6,
    cursor: "pointer",
    textAlign: "center",
    lineHeight: "40px",
    border: "1px solid #1e293b"
  },

  streak: {
    textAlign: "center"
  },

  best: {
    textAlign: "center",
    color: "#facc15"
  },

  heatmap: {
    gridColumn: "1 / -1",
    display: "grid",
    gridTemplateColumns: "repeat(30, 1fr)",
    gap: 3,
    marginTop: 10
  },

  heatCell: {
    height: 8,
    borderRadius: 2
  }
};