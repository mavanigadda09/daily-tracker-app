import { useMemo } from "react";

export default function Insights({ items = [] }) {

  const habits = items.filter(i => i.type === "habit");
  const activities = items.filter(i => i.type === "activity");

  // ================= HABIT TOTAL =================
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

  // ================= PROCESS DATES =================
  const processDates = () => {
    let allDates = [];

    habits.forEach((h) => {
      const entries = Object.entries(h.completed || {})
        .filter(([_, v]) => v)
        .map(([date]) => new Date(date));

      allDates.push(...entries);
    });

    return allDates.sort((a, b) => a - b);
  };

  // ================= BEST STREAK =================
  const getBestStreak = () => {
    const dates = processDates();
    if (dates.length === 0) return 0;

    let best = 1;
    let streak = 1;

    for (let i = 1; i < dates.length; i++) {
      const diff =
        (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        streak++;
        best = Math.max(best, streak);
      } else if (diff > 1) {
        streak = 1;
      }
    }

    return best;
  };

  // ================= CURRENT STREAK =================
  const getCurrentStreak = () => {
    const dates = processDates();
    if (dates.length === 0) return 0;

    let streak = 1;

    for (let i = dates.length - 1; i > 0; i--) {
      const diff =
        (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // ================= TODAY HABITS =================
  const todayStr = new Date().toDateString();

  const todayStats = useMemo(() => {
    let total = habits.length;
    let done = 0;

    habits.forEach((h) => {
      if (h.completed?.[todayStr]) done++;
    });

    const percent = total ? Math.round((done / total) * 100) : 0;

    return { total, done, percent };
  }, [habits, todayStr]);

  // ================= ACTIVITY STATS =================
  const activityStats = useMemo(() => {
    let totalValue = 0;
    let totalTarget = 0;

    activities.forEach((a) => {
      totalValue += a.value || 0;
      totalTarget += a.target || 0;
    });

    const percent = totalTarget
      ? Math.min(Math.round((totalValue / totalTarget) * 100), 100)
      : 0;

    return { totalValue, totalTarget, percent };
  }, [activities]);

  const today = new Date().toDateString();

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>Insights</h1>
      <p style={styles.subtitle}>Your performance overview</p>

      <div style={styles.grid}>

        {/* HABIT COMPLETION */}
        <div style={styles.card}>
          <h3>Habits</h3>

          <div style={styles.circleWrapper}>
            <div style={styles.circle}>
              {totalStats.percent}%
            </div>
          </div>

          <p style={styles.subtext}>
            {totalStats.completed} / {totalStats.total}
          </p>
        </div>

        {/* BEST STREAK */}
        <div style={styles.card}>
          <h3>🔥 Best Streak</h3>
          <div style={styles.big}>{getBestStreak()}</div>
        </div>

        {/* CURRENT STREAK */}
        <div style={styles.card}>
          <h3>⚡ Current Streak</h3>
          <div style={styles.big}>{getCurrentStreak()}</div>
        </div>

        {/* TODAY HABITS */}
        <div style={styles.card}>
          <h3>📅 Today Habits</h3>
          <div style={styles.date}>{today}</div>
          <p style={styles.subtext}>
            {todayStats.done} / {todayStats.total} ({todayStats.percent}%)
          </p>
        </div>

        {/* ACTIVITY PROGRESS (NEW 🔥) */}
        <div style={styles.card}>
          <h3>📊 Activities</h3>

          <div style={styles.circleWrapper}>
            <div style={styles.circleBlue}>
              {activityStats.percent}%
            </div>
          </div>

          <p style={styles.subtext}>
            {activityStats.totalValue} / {activityStats.totalTarget}
          </p>
        </div>

      </div>

    </div>
  );
}

// ================= STYLES =================

const styles = {
  container: {
    padding: 30,
    color: "#111827"
  },

  title: {
    fontSize: 28,
    marginBottom: 5
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: 20
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20
  },

  card: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    textAlign: "center"
  },

  circleWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10
  },

  circle: {
    width: 110,
    height: 110,
    borderRadius: "50%",
    border: "10px solid #16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827"
  },

  // 🔵 NEW COLOR FOR ACTIVITIES
  circleBlue: {
    width: 110,
    height: 110,
    borderRadius: "50%",
    border: "10px solid #3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827"
  },

  subtext: {
    color: "#6b7280"
  },

  big: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#16a34a"
  },

  date: {
    fontSize: 14,
    color: "#374151"
  }
};