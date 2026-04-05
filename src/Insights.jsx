import { useMemo } from "react";

export default function Insights({ items = [] }) {

  const habits = useMemo(
    () => items.filter(i => i.type === "habit"),
    [items]
  );

  const activities = useMemo(
    () => items.filter(i => i.type === "activity"),
    [items]
  );

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

    const percent = total
      ? Math.round((completed / total) * 100)
      : 0;

    return { total, completed, percent };
  }, [habits]);

  // ================= DATES (MEMOIZED) =================
  const dates = useMemo(() => {
    let arr = [];

    habits.forEach((h) => {
      Object.entries(h.completed || {})
        .filter(([_, v]) => v)
        .forEach(([d]) => arr.push(new Date(d)));
    });

    return arr.sort((a, b) => a - b);
  }, [habits]);

  // ================= STREAK =================
  const { bestStreak, currentStreak } = useMemo(() => {
    if (!dates.length) return { bestStreak: 0, currentStreak: 0 };

    let best = 1;
    let current = 1;

    for (let i = 1; i < dates.length; i++) {
      const diff =
        (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }

    // current streak from end
    let streak = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const diff =
        (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);

      if (diff === 1) streak++;
      else break;
    }

    return { bestStreak: best, currentStreak: streak };
  }, [dates]);

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

  // ================= AI INSIGHT =================
  const aiMessage = useMemo(() => {
    if (totalStats.percent < 40) {
      return "⚠️ Your consistency is low. Start small.";
    }

    if (currentStreak >= 5) {
      return "🔥 You're on a strong streak. Keep going!";
    }

    if (activityStats.percent < 50) {
      return "📉 Increase activity to reach your goals.";
    }

    return "🚀 You're doing great. Stay consistent.";
  }, [totalStats, currentStreak, activityStats]);

  const today = new Date().toDateString();

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>📊 Insights</h1>
      <p style={styles.subtitle}>Your performance overview</p>

      {/* 🤖 AI MESSAGE */}
      <div style={styles.aiBox}>
        {aiMessage}
      </div>

      <div style={styles.grid}>

        <Card title="Habits">
          <Circle value={totalStats.percent} color="#6366f1" />
          <p style={styles.subtext}>
            {totalStats.completed} / {totalStats.total}
          </p>
        </Card>

        <Card title="🔥 Best Streak">
          <div style={styles.big}>{bestStreak}</div>
        </Card>

        <Card title="⚡ Current Streak">
          <div style={styles.bigPurple}>{currentStreak}</div>
        </Card>

        <Card title="📅 Today">
          <div style={styles.date}>{today}</div>
          <p style={styles.subtext}>
            {todayStats.done} / {todayStats.total} ({todayStats.percent}%)
          </p>
        </Card>

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
    fontSize: 28
  },

  subtitle: {
    color: "var(--text-muted)"
  },

  aiBox: {
    background: "var(--card)",
    padding: 12,
    borderRadius: 12,
    border: "1px solid var(--border)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20
  },

  card: {
    background: "var(--card)",
    padding: 20,
    borderRadius: 16,
    textAlign: "center"
  },

  cardTitle: {
    marginBottom: 10
  },

  circle: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "10px auto",
    fontWeight: "bold"
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