import React, { useEffect, useRef, useState } from "react";
import { theme } from "./theme";
import { useNotification } from "./context/NotificationContext";

export default function Dashboard({ user, tasks = [], items = [], weightLogs = [] }) {
  const { showNotification } = useNotification();
  const welcomeShown = useRef(false);
  
  // Local state for steps (initialized to 0)
  const [steps, setSteps] = useState(0); 

  /* ================= PHOENIX TOAST WELCOME ================= */
  useEffect(() => {
    if (user && user.name && !welcomeShown.current) {
      showNotification(`Welcome back, ${user.name} 🔥`, "success");
      welcomeShown.current = true;
    }
  }, [user, showNotification]);

  /* ================= STATS CALCULATION & FALLBACKS ================= */
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const activeHabits = items.filter(i => i.type === "habit").length;
  
  // Stability Fix: Fallback to 0.0 if no weight logs exist
  const hasWeightData = weightLogs && weightLogs.length > 0;
  const latestWeight = hasWeightData 
    ? weightLogs[weightLogs.length - 1].weight 
    : "0.0";

  // Calculate step progress percentage
  const stepGoal = 10000;
  const progressPercent = Math.min((steps / stepGoal) * 100, 100);

  return (
    <div style={styles.pageWrapper}>
      {/* PHOENIX BACKGROUND WATERMARK (Handled by App.css class) */}
      <div className="phoenix-watermark" />

      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.greeting}>
            Rise, <span className="text-phoenix-gradient">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p style={styles.subtitle}>Your daily progress is synchronized.</p>
        </header>

        {/* BENTO GRID LAYOUT - Using Compaction Classes */}
        <div className="bento-grid-mobile" style={styles.bentoGrid}>
          
          {/* Main Activity Card (Bento Large / Full-width mobile) */}
          <div className="glass-panel main-card-mobile" style={{ ...styles.card, ...styles.mainCard }}>
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
            
            <button 
              onClick={() => setSteps(prev => prev + 500)}
              style={styles.stepBtn}
            >
              +500 Steps
            </button>
          </div>

          {/* Stats Bento (Side-by-side on mobile via CSS) */}
          <div className="glass-panel" style={styles.card}>
            <p style={styles.statLabel}>Tasks Done</p>
            <h2 className="stat-value-mobile" style={styles.statValue}>{completedTasks}</h2>
          </div>

          <div className="glass-panel" style={styles.card}>
            <p style={styles.statLabel}>Active Habits</p>
            <h2 className="stat-value-mobile" style={styles.statValue}>{activeHabits}</h2>
          </div>

          {/* Health Summary Card (Full-width mobile) */}
          <div className="glass-panel main-card-mobile" style={styles.card}>
            <h3 style={styles.cardTitle}>Current Weight</h3>
            <h2 style={styles.statValue}>
              {latestWeight} <small style={{fontSize: '14px', color: 'var(--text-muted)'}}>kg</small>
            </h2>
            
            {!hasWeightData ? (
              <p style={styles.fallbackText}>
                ⚠️ No logs found. Start tracking in Habits!
              </p>
            ) : (
              <div style={styles.miniChartPlaceholder}>
                  <div style={{...styles.sparkBar, height: '40%'}}></div>
                  <div style={{...styles.sparkBar, height: '70%'}}></div>
                  <div style={{...styles.sparkBar, height: '50%', background: 'var(--accent-orange)', opacity: 1}}></div>
              </div>
            )}
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
    color: "var(--text)",
    overflowX: "hidden",
    padding: "20px",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: { marginBottom: "30px" },
  greeting: { fontSize: "2.5rem", fontWeight: "bold", margin: 0 },
  subtitle: { color: "var(--text-muted)", marginTop: "5px", fontSize: "14px" },
  bentoGrid: {
    display: "grid",
    // Base layout for desktop; CSS handles the mobile repeat(2, 1fr)
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  },
  card: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  mainCard: {
    gridRow: "span 1", 
  },
  cardTitle: { 
    fontSize: "0.75rem", 
    marginBottom: "15px", 
    color: "var(--text-muted)", 
    textTransform: "uppercase", 
    letterSpacing: "1.5px" 
  },
  statValue: { fontSize: "2.5rem", fontWeight: "800", margin: 0, color: "var(--accent)" },
  statLabel: { color: "var(--text-muted)", margin: "0 0 5px 0", fontSize: "0.85rem" },
  progressCircleContainer: { margin: "10px 0" },
  progressCircle: {
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    border: `8px solid transparent`,
    borderTopColor: 'var(--accent)',
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.03)",
  },
  progressValue: { fontSize: "32px", fontWeight: "bold", color: "#fff" },
  progressLabel: { fontSize: "11px", color: "var(--text-muted)" },
  goalTrack: { width: "100%", height: "6px", background: "#1e293b", borderRadius: "10px", marginTop: "20px", overflow: "hidden" },
  goalFill: { height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent-orange))", transition: "width 0.5s ease" },
  cardFooter: { marginTop: "10px", color: "var(--text-muted)", fontSize: "11px" },
  stepBtn: {
    marginTop: "15px",
    padding: "8px 20px",
    borderRadius: "20px",
    border: "none",
    background: "rgba(250, 204, 21, 0.1)",
    color: "var(--accent)",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  miniChartPlaceholder: { display: "flex", alignItems: "flex-end", gap: "6px", height: "40px", marginTop: "15px", width: "100%" },
  sparkBar: { flex: 1, background: "var(--accent)", opacity: 0.2, borderRadius: "3px" },
  fallbackText: {
    fontSize: '11px', 
    color: 'var(--accent-orange)', 
    marginTop: '12px',
    fontStyle: 'italic'
  }
};