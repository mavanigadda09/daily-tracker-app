import { useMemo } from "react";

export default function Insights({ items = [] }) {

  const habits = items.filter(i => i.type === "habit");
  const activities = items.filter(i => i.type === "activity");

  // ================= HABIT TOTAL =================
  const totalStats = useMemo(() => {
    let total = 0;
    let completed = 0;

    habits.forEach((h) => {
      Object.values(h.completed || {}).forEach((v) => {
        total++;
        if (v) completed++;
      });
    });

    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [habits]);

  // ================= DATES =================
  const processDates = () => {
    let dates = [];

    habits.forEach((h) => {
      Object.entries(h.completed || {})
        .filter(([_, v]) => v)
        .forEach(([d]) => dates.push(new Date(d)));
    });

    return dates.sort((a, b) => a - b);
  };

  // ================= STREAK =================
  const getBestStreak = () => {
    const dates = processDates();
    if (!dates.length) return 0;

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

  const getCurrentStreak = () => {
    const dates = processDates();
    if (!dates.length) return 0;

    let streak = 1;

    for (let i = dates.length - 1; i > 0; i--) {
      const diff =
        (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);

      if (diff === 1) streak++;
      else break;
    }

    return streak;
  };

  // ================= TODAY =================
  const todayStr = new Date().toDateString();

  const todayStats = useMemo(() => {
    let total = habits.length;
    let done = 0;

    habits.forEach((h) => {
      if (h.completed?.[todayStr]) done++;
    });

    const percent = total
      ? Math.round((done / total) * 100)
      : 0;

    return { total, done, percent };
  }, [habits, todayStr]);

  // ================= ACTIVITY =================
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

        {/* HABITS */}
        <Card title="Habits">
          <Circle value={totalStats.percent} color="#6366f1" />
          <p style={styles.subtext}>
            {totalStats.completed} / {totalStats.total}
          </p>
        </Card>

        {/* BEST */}
        <Card title="🔥 Best Streak">
          <div style={styles.big}>{getBestStreak()}</div>
        </Card>

        {/* CURRENT */}
        <Card title="⚡ Current Streak">
          <div style={styles.bigPurple}>{getCurrentStreak()}</div>
        </Card>

        {/* TODAY */}
        <Card title="📅 Today">
          <div style={styles.date}>{today}</div>
          <p style={styles.subtext}>
            {todayStats.done} / {todayStats.total} ({todayStats.percent}%)
          </p>
        </Card>

        {/* ACTIVITIES */}
        <Card title="📊 Activities">
          <Circle value={activityStats.percent} color="#22c55e" />
          <p style={styles.subtext}>
            {activityStats.totalValue} / {activityStats.totalTarget}
          </p>
        </Card>

      </div>

    </div>
  );
}

// ================= COMPONENTS =================
function Card({ title, children }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Circle({ value, color }) {
  return (
    <div style={{
      ...styles.circle,
      border: `8px solid ${color}`
    }}>
      {value}%
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    padding: 30,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    color: "var(--text)"
  },

  title: {
    fontSize: 28,
    color: "var(--text)"
  },

  subtitle: {
    color: "var(--text-muted)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: 20,
    borderRadius: 16,
    textAlign: "center",
    transition: "0.3s"
  },

  cardTitle: {
    marginBottom: 10,
    color: "var(--text)"
  },

  circle: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "10px auto",
    fontWeight: "bold",
    fontSize: 18,
    color: "#fff"
  },

  big: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#22c55e"
  },

  bigPurple: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#6366f1"
  },

  subtext: {
    color: "var(--text-muted)"
  },

  date: {
    fontSize: 14,
    color: "var(--text-muted)"
  }
};