import React, { useEffect, useRef, useState } from "react";
import { theme } from "./theme";

export default function Dashboard({ user, tasks = [], items = [], weightLogs = [] }) {
  const welcomeShown = useRef(false);
  
  // Fix: Initialized at 0. No auto-incrementing useEffect to prevent "Ghost Steps".
  const [steps, setSteps] = useState(0); 

  /* ================= FIX: SESSION-AWARE POPUP ================= */
  useEffect(() => {
    // Uses the useRef to ensure alert only triggers once per session load
    if (user && user.name && !welcomeShown.current) {
      alert(`Welcome back, ${user.name} 🚀`);
      welcomeShown.current = true;
    }
  }, [user]);

  /* ================= STATS CALCULATION ================= */
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const activeHabits = items.filter(i => i.type === "habit").length;
  const latestWeight = weightLogs.length > 0 
    ? weightLogs[weightLogs.length - 1].weight 
    : "N/A";

  // Calculate step progress percentage
  const stepGoal = 10000;
  const progressPercent = Math.min((steps / stepGoal) * 100, 100);

  return (
    <div style={styles.pageWrapper}>
      {/* PHOENIX BACKGROUND WATERMARK - Optimized Opacity */}
      <div style={styles.watermarkContainer}>
        <img src="/phoenix.png" style={styles.watermark} alt="Phoenix Logo" />
      </div>

      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.greeting}>
            Rise, <span style={styles.accentText}>{user?.name?.split(' ')[0] || 'User'}</span> 🔥
          </h1>
          <p style={styles.subtitle}>Your daily progress is synchronized.</p>
        </header>

        {/* BENTO GRID LAYOUT */}
        <div style={styles.bentoGrid}>
          
          {/* Main Activity Card (Bento Large) */}
          <div className="glass-panel" style={{ ...styles.card, ...styles.mainCard }}>
            <h3 style={styles.cardTitle}>Daily Movement</h3>
            <div style={styles.progressCircleContainer}>
              <div style={{
                ...styles.progressCircle,
                borderColor: steps > 0 ? 'var(--accent)' : '#1e293b'
              }}>
                <span style={styles.progressValue}>{steps.toLocaleString()}</span>
                <span style={styles.progressLabel}>Steps</span>
              </div>
            </div>
            
            <div style={styles.goalTrack}>
                <div style={{...styles.goalFill, width: `${progressPercent}%`}}></div>
            </div>
            <p style={styles.cardFooter}>Goal: 10,000 steps</p>
            
            {/* Manual increment for testing/real tracking */}
            <button 
              onClick={() => setSteps(prev => prev + 500)}
              style={styles.stepBtn}
            >
              +500 Steps
            </button>
          </div>

          {/* Stats Bento Column (Side-by-Side Mobile Optimization) */}
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

          {/* Health Summary Card */}
          <div className="glass-panel" style={styles.card}>
            <h3 style={styles.cardTitle}>Current Weight</h3>
            <h2 style={styles.statValue}>
              {latestWeight} <small style={{fontSize: '14px', color: 'var(--text-muted)'}}>kg</small>
            </h2>
            <div style={styles.miniChartPlaceholder}>
                <div style={{...styles.sparkBar, height: '40%'}}></div>
                <div style={{...styles.sparkBar, height: '70%'}}></div>
                <div style={{...styles.sparkBar, height: '50%', background: '#f97316', opacity: 1}}></div>
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
    overflowX: "hidden",
    padding: theme.spacing.lg,
  },
  watermarkContainer: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 0,
    opacity: 0.05, // Phoenix Branding: Low opacity watermark
    pointerEvents: "none",
  },
  watermark: {
    width: "min(90vw, 600px)",
    filter: "grayscale(100%) brightness(200%)",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: theme.spacing.md,
  },
  card: {
    background: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  mainCard: {
    gridRow: "span 2",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  statsCol: { 
    display: "flex", 
    flexDirection: "column", 
    gap: theme.spacing.md 
  },
  cardTitle: { 
    fontSize: "0.8rem", 
    marginBottom: theme.spacing.md, 
    color: theme.colors.textMuted, 
    textTransform: "uppercase", 
    letterSpacing: "1.5px" 
  },
  statValue: { fontSize: "2.8rem", fontWeight: "800", margin: 0, color: "#facc15" },
  statLabel: { color: theme.colors.textMuted, margin: 0, fontSize: "0.85rem" },
  progressCircleContainer: { margin: "20px 0" },
  progressCircle: {
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    border: `10px solid transparent`,
    borderTopColor: '#facc15', // Gold accent
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.03)",
    boxShadow: `inset 0 0 20px rgba(0,0,0,0.2)`,
  },
  progressValue: { fontSize: "42px", fontWeight: "bold", color: "#fff" },
  progressLabel: { fontSize: "12px", color: theme.colors.textMuted },
  goalTrack: { width: "80%", height: "8px", background: "#1e293b", borderRadius: "10px", marginTop: "24px", overflow: "hidden" },
  goalFill: { height: "100%", background: "linear-gradient(90deg, #facc15, #f97316)", transition: "width 0.5s ease-in-out" },
  cardFooter: { marginTop: "12px", color: theme.colors.textMuted, fontSize: "12px" },
  stepBtn: {
    marginTop: "20px",
    padding: "8px 16px",
    borderRadius: "20px",
    border: "none",
    background: "rgba(250, 204, 21, 0.1)",
    color: "#facc15",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  miniChartPlaceholder: { display: "flex", alignItems: "flex-end", gap: "8px", height: "50px", marginTop: "20px" },
  sparkBar: { flex: 1, background: "#facc15", opacity: 0.2, borderRadius: "4px" }
};