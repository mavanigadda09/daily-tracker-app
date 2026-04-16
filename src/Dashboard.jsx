import { useEffect, useRef, useState } from "react";
import { theme } from "./theme";

export default function Dashboard({ user, tasks = [], items = [], weightLogs = [] }) {
  const welcomeShown = useRef(false);
  const [steps, setSteps] = useState(0); // Fix: Start at 0, no auto-simulation

  /* ================= FIX: POPUP LOGIC ================= */
  useEffect(() => {
    // Only alert if we have a user AND it hasn't been shown this session load
    if (user && user.name && !welcomeShown.current) {
      alert(`Welcome back, ${user.name} 🚀`);
      welcomeShown.current = true;
    }
  }, [user]);

  /* ================= STATS CALCULATION ================= */
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const activeHabits = items.filter(i => i.type === "habit").length;
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : "N/A";

  return (
    <div style={styles.pageWrapper}>
      {/* PHOENIX BACKGROUND WATERMARK */}
      <div style={styles.watermarkContainer}>
        <img src="/phoenix.png" style={styles.watermark} alt="Phoenix Logo" />
      </div>

      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.greeting}>Rise, <span style={styles.accentText}>{user?.name?.split(' ')[0] || 'User'}</span> 🔥</h1>
          <p style={styles.subtitle}>Your daily progress is synchronized.</p>
        </header>

        {/* BENTO GRID LAYOUT */}
        <div style={styles.bentoGrid}>
          {/* Main Activity Card */}
          <div className="glass-panel" style={{ ...styles.card, ...styles.mainCard }}>
            <h3 style={styles.cardTitle}>Daily Movement</h3>
            <div style={styles.progressCircleContainer}>
              <div style={styles.progressCircle}>
                <span style={styles.progressValue}>{steps}</span>
                <span style={styles.progressLabel}>Steps</span>
              </div>
            </div>
            <div style={styles.goalTrack}>
                <div style={{...styles.goalFill, width: `${Math.min((steps / 10000) * 100, 100)}%`}}></div>
            </div>
            <p style={styles.cardFooter}>Goal: 10,000 steps</p>
          </div>

          {/* Stats Bento Column */}
          <div style={styles.statsCol}>
            <div className="glass-panel" style={styles.card}>
              <p style={styles.statLabel}>Tasks Done</p>
              <h2 style={styles.statValue}>{completedTasks}</h2>
            </div>
            <div className="glass-panel" style={styles.card}>
              <p style={styles.statLabel}>Active Habits</p>
              <h2 style={styles.statValue}>{activeHabits}</h2>
            </div>
          </div>

          {/* Health Summary */}
          <div className="glass-panel" style={styles.card}>
            <h3 style={styles.cardTitle}>Current Weight</h3>
            <h2 style={styles.statValue}>{latestWeight} <small style={{fontSize: '14px'}}>kg</small></h2>
            <div style={styles.miniChartPlaceholder}>
                <div style={{...styles.sparkBar, height: '40%'}}></div>
                <div style={{...styles.sparkBar, height: '70%'}}></div>
                <div style={{...styles.sparkBar, height: '50%', background: 'var(--accent-orange)'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    position: "relative",
    minHeight: "100vh",
    background: theme.colors.bg,
    color: theme.colors.text,
    overflow: "hidden",
    padding: theme.spacing.lg,
  },
  watermarkContainer: {
    position: "fixed",
    top: "50%",
    left: "55%",
    transform: "translate(-50%, -50%)",
    zIndex: 0,
    opacity: 0.07,
    pointerEvents: "none",
  },
  watermark: {
    width: "700px",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: { marginBottom: theme.spacing.xl },
  greeting: { fontSize: "2.5rem", fontWeight: "bold", margin: 0 },
  accentText: {
    background: "linear-gradient(135deg, #facc15, #f97316)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
  bentoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: theme.spacing.md,
  },
  card: {
    background: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
  },
  mainCard: {
    gridRow: "span 2",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  statsCol: { display: "flex", flexDirection: "column", gap: theme.spacing.md },
  cardTitle: { fontSize: "0.9rem", marginBottom: theme.spacing.md, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "1px" },
  statValue: { fontSize: "2.5rem", margin: 0, color: "var(--accent)" },
  statLabel: { color: theme.colors.textMuted, margin: 0, fontSize: "0.85rem" },
  progressCircleContainer: { margin: "20px 0" },
  progressCircle: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    border: `8px solid var(--accent)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 0 30px rgba(250, 204, 21, 0.15)`,
  },
  progressValue: { fontSize: "36px", fontWeight: "bold" },
  progressLabel: { fontSize: "12px", color: "var(--text-muted)" },
  goalTrack: { width: "80%", height: "6px", background: "#1e293b", borderRadius: "10px", marginTop: "20px", overflow: "hidden" },
  goalFill: { height: "100%", background: "linear-gradient(90deg, #facc15, #f97316)" },
  cardFooter: { marginTop: "10px", color: "var(--text-muted)", fontSize: "12px" },
  miniChartPlaceholder: { display: "flex", alignItems: "flex-end", gap: "6px", height: "40px", marginTop: "20px" },
  sparkBar: { flex: 1, background: "var(--accent)", opacity: 0.3, borderRadius: "3px" }
};