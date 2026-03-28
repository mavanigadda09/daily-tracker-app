import { useMemo } from "react";

export default function Insights({ items }) {

  const habits = items.filter(i => i.type === "habit");

  // ================= TOTAL =================
  const totalStats = useMemo(() => {
    let total = 0;
    let completed = 0;

    habits.forEach((h) => {
      const data = h.completed || {};
      Object.values(data).forEach((v) => {
        total++;
        if (v) completed++;
      });
    });

    const percent = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percent };
  }, [habits]);

  // ================= BEST STREAK =================
  const getBestStreak = () => {
    let best = 0;

    habits.forEach((h) => {
      const entries = Object.entries(h.completed || {})
        .filter(([_, v]) => v)
        .sort();

      let streak = 0;

      entries.forEach(() => {
        streak++;
        best = Math.max(best, streak);
      });
    });

    return best;
  };

  const today = new Date().toDateString();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Insights</h1>

      <div style={styles.grid}>

        <div style={styles.card}>
          <h3>Completion</h3>
          <div style={styles.circle}>{totalStats.percent}%</div>
          <p>{totalStats.completed} / {totalStats.total}</p>
        </div>

        <div style={styles.card}>
          <h3>🔥 Best Streak</h3>
          <div style={styles.big}>{getBestStreak()}</div>
        </div>

        <div style={styles.card}>
          <h3>📅 Today</h3>
          <div>{today}</div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { padding: 30 },
  title: { fontSize: 28, marginBottom: 20 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20
  },

  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16,
    textAlign: "center"
  },

  circle: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    border: "8px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "10px auto",
    fontSize: 22
  },

  big: {
    fontSize: 40,
    fontWeight: "bold"
  }
};