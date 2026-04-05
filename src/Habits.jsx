import { useState, useMemo } from "react";

export default function Habits({ items = [], setItems }) {

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const [name, setName] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  const addHabit = () => {
    if (!name.trim()) return;

    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        type: "habit",
        completed: {}
      }
    ]);

    setName("");
  };

  const deleteHabit = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const getKey = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

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

  const last30 = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return getKey(d);
    });
  }, []);

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

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🔥 Habits Tracker</h1>

      <div style={styles.navRow}>
        <button onClick={() => setWeekOffset(p => p - 1)}>⬅</button>
        <button onClick={() => setWeekOffset(0)}>Today</button>
        <button onClick={() => setWeekOffset(p => p + 1)}>➡</button>
      </div>

      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="New Habit"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={addHabit}>Add</button>
      </div>

      {habits.length === 0 && (
        <p style={styles.empty}>
          No habits yet 🚀
        </p>
      )}

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
          <div></div>

          {habits.map((h) => {
            const completed = h.completed || {};

            return (
              <div key={h.id} style={{ display: "contents" }}>

                <div style={styles.habit}>{h.name}</div>

                {week.map((d) => (
                  <div
                    key={d.key}
                    onClick={() => toggleDay(h.id, d.key)}
                    style={{
                      ...styles.cell,
                      background: completed[d.key]
                        ? "#16a34a"
                        : "#f3f4f6"
                    }}
                  >
                    {completed[d.key] ? "✔" : ""}
                  </div>
                ))}

                <div>{getStreak(h)}</div>
                <div>{getBestStreak(h)}</div>

                <button onClick={() => deleteHabit(h.id)}>❌</button>

                <div style={styles.heatmap}>
                  {last30.map((k) => (
                    <div
                      key={k}
                      style={{
                        ...styles.heatCell,
                        background: completed[k]
                          ? "#16a34a"
                          : "#e5e7eb"
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

// ✅ ADD THIS (FIX)
const styles = {
  container: { padding: 20, color: "white" },
  title: { marginBottom: 10 },
  navRow: { display: "flex", gap: 10, marginBottom: 10 },
  card: { marginBottom: 10 },
  input: { padding: 8 },
  empty: { marginTop: 10 },
  grid: { display: "grid", gridTemplateColumns: "repeat(12, auto)", gap: 8 },
  headerCell: { textAlign: "center" },
  habit: { fontWeight: "bold" },
  cell: { width: 30, height: 30, cursor: "pointer" },
  heatmap: { display: "flex", gap: 2 },
  heatCell: { width: 6, height: 6 }
};