import React, { useEffect, useRef, useState } from "react";
import { useNotification } from "./context/NotificationContext";

export default function Dashboard({ user, tasks = [], items = [], weightLogs = [] }) {
  const { showNotification } = useNotification();
  const welcomeShown = useRef(false);
  const [steps, setSteps] = useState(0);

  /* ================= 🚶 AUTOMATIC STEP LOGIC ================= */
  useEffect(() => {
    let lastZ = 0;
    let lastUpdate = 0;

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const currentTime = Date.now();
      if ((currentTime - lastUpdate) > 100) {
        const deltaZ = Math.abs(acc.z - lastZ);
        // Threshold: A value of ~10-12 usually indicates a distinct step/jerk
        if (deltaZ > 12) {
          setSteps(prev => prev + 1);
        }
        lastZ = acc.z;
        lastUpdate = currentTime;
      }
    };

    const requestPermission = async () => {
      try {
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
          const response = await DeviceMotionEvent.requestPermission();
          if (response === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        } else {
          // Standard browser support
          window.addEventListener("devicemotion", handleMotion);
        }
      } catch (err) {
        console.warn("Motion sensors not accessible:", err);
      }
    };

    requestPermission();
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  /* ================= PHOENIX TOAST WELCOME ================= */
  useEffect(() => {
    if (user && user.name && !welcomeShown.current) {
      showNotification(`Welcome back, ${user.name} 🔥`, "success");
      welcomeShown.current = true;
    }
  }, [user, showNotification]);

  /* ================= 📈 LIVE SVG SPARKLINE LOGIC ================= */
  const renderSparkline = () => {
    if (weightLogs.length < 2) {
      return <p style={styles.fallbackText}>⚠️ Log weight twice to see trend line</p>;
    }

    const width = 180;
    const height = 40;
    const padding = 5;
    const weights = weightLogs.slice(-7).map(l => parseFloat(l.weight));
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;

    // Generate points for the SVG polyline
    const points = weights.map((w, i) => {
      const x = (i / (weights.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((w - min) / range * (height - padding * 2) + padding);
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg width={width} height={height} style={{ marginTop: '15px' }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-orange)" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  /* ================= STATS CALCULATION ================= */
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const activeHabits = items.filter(i => i.type === "habit").length;
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : "0.0";
  const stepGoal = 10000;
  const progressPercent = Math.min((steps / stepGoal) * 100, 100);

  return (
    <div style={styles.pageWrapper}>
      <div className="phoenix-watermark" />

      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.greeting}>
            Rise, <span className="text-phoenix-gradient">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p style={styles.subtitle}>Your daily vitals are synchronized.</p>
        </header>

        <div className="bento-grid-mobile" style={styles.bentoGrid}>
          
          {/* Main Activity Card */}
          <div className="glass-panel main-card-mobile" style={{ ...styles.card, ...styles.mainCard }}>
            <h3 style={styles.cardTitle}>Daily Movement</h3>
            <div style={styles.progressCircleContainer}>
              <div style={{
                ...styles.progressCircle,
                borderColor: steps > 0 ? 'var(--accent)' : '#1e293b'
              }}>
                <span style={styles.progressValue}>{steps}</span>
                <span style={styles.progressLabel}>Steps</span>
              </div>
            </div>
            
            <div style={styles.goalTrack}>
                <div style={{...styles.goalFill, width: `${progressPercent}%`}}></div>
            </div>
            <p style={styles.cardFooter}>Auto-tracking active via motion sensors</p>
          </div>

          <div className="glass-panel" style={styles.card}>
            <p style={styles.statLabel}>Tasks Done</p>
            <h2 className="stat-value-mobile" style={styles.statValue}>{completedTasks}</h2>
          </div>

          <div className="glass-panel" style={styles.card}>
            <p style={styles.statLabel}>Active Habits</p>
            <h2 className="stat-value-mobile" style={styles.statValue}>{activeHabits}</h2>
          </div>

          {/* Health Summary with Live Sparkline */}
          <div className="glass-panel main-card-mobile" style={styles.card}>
            <h3 style={styles.cardTitle}>Weight Trend</h3>
            <h2 style={styles.statValue}>
              {latestWeight} <small style={{fontSize: '14px', color: 'var(--text-muted)'}}>kg</small>
            </h2>
            {renderSparkline()}
          </div>
          
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { position: "relative", minHeight: "100vh", color: "var(--text)", overflowX: "hidden", padding: "20px" },
  content: { position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" },
  header: { marginBottom: "30px" },
  greeting: { fontSize: "2.5rem", fontWeight: "bold", margin: 0 },
  subtitle: { color: "var(--text-muted)", marginTop: "5px", fontSize: "14px" },
  bentoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" },
  card: { padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
  mainCard: { gridRow: "span 1" },
  cardTitle: { fontSize: "0.75rem", marginBottom: "15px", color: "