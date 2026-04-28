/**
 * HealthPage.jsx — Unified Health & Habits Dashboard
 *
 * Merges:
 *  - Native Android step counter (TYPE_STEP_COUNTER via StepCounterPlugin)
 *  - GPS running tracker (Capacitor Geolocation)
 *  - Full Habits dashboard
 */

import React from "react";
import { useStepCounter, PermissionState } from "../../hooks/useStepCounter";
import { useRunTracker, RunPermission }    from "../../hooks/useRunTracker";
import HabitsComponent from "../../habits/Habits.jsx";
import RunHistory from "./RunHistory";

// ─── Styles ───────────────────────────────────────────────────────────────
const s = {
  page: {
    padding: "16px",
    paddingBottom: "32px",
    maxWidth: "480px",
    margin: "0 auto",
    fontFamily: "var(--font-body, system-ui, sans-serif)",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-text-secondary, #888)",
    marginBottom: "12px",
    marginTop: "28px",
  },
  stepCard: {
    background: "var(--color-surface, #1a1a2e)",
    borderRadius: "20px",
    padding: "24px 20px",
    display: "flex",
    alignItems: "center",
    gap: "24px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
    position: "relative",
    overflow: "hidden",
    marginBottom: "4px",
  },
  stepCardGlow: {
    position: "absolute", top: "-40px", right: "-40px",
    width: "160px", height: "160px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,179,237,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ringWrap: { flexShrink: 0, position: "relative", width: "110px", height: "110px" },
  stepInfo: { flex: 1, minWidth: 0 },
  stepCount: {
    fontSize: "36px", fontWeight: 800, lineHeight: 1,
    color: "var(--color-text, #f0f0f0)", letterSpacing: "-0.02em",
  },
  stepLabel: {
    fontSize: "12px", color: "var(--color-text-secondary, #888)",
    marginTop: "2px", marginBottom: "10px",
  },
  goalBar: {
    height: "6px", borderRadius: "3px",
    background: "var(--color-border, rgba(255,255,255,0.08))",
    overflow: "hidden", marginBottom: "6px",
  },
  goalBarFill: (pct) => ({
    height: "100%", borderRadius: "3px",
    width: `${Math.min(pct, 100)}%`,
    background: pct >= 100
      ? "linear-gradient(90deg, #48bb78, #38a169)"
      : "linear-gradient(90deg, #63b3ed, #4299e1)",
    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
  }),
  goalText: { fontSize: "11px", color: "var(--color-text-secondary, #888)" },
  statsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px", marginTop: "12px",
  },
  statCard: {
    background: "var(--color-surface, #1a1a2e)",
    borderRadius: "14px", padding: "14px 10px", textAlign: "center",
  },
  statValue: { fontSize: "20px", fontWeight: 800, color: "var(--color-text, #f0f0f0)", lineHeight: 1 },
  statUnit:  { fontSize: "10px", color: "var(--color-text-secondary, #888)", marginTop: "4px" },

  // Run tracker
  runCard: {
    background: "var(--color-surface, #1a1a2e)",
    borderRadius: "20px", padding: "20px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
    position: "relative", overflow: "hidden",
  },
  runGlow: {
    position: "absolute", top: "-40px", left: "-40px",
    width: "160px", height: "160px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  runMetricsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "8px", marginBottom: "16px",
  },
  runMetric: { textAlign: "center" },
  runMetricValue: {
    fontSize: "18px", fontWeight: 800, lineHeight: 1,
    color: "var(--color-text, #f0f0f0)",
    fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
  },
  runMetricUnit: {
    fontSize: "9px", color: "var(--color-text-secondary, #888)",
    marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.08em",
  },
  runDivider: { height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 0 14px" },
  runControls: { display: "flex", gap: "10px" },
  runBtn: (variant) => ({
    flex: variant === "primary" ? 2 : 1,
    padding: "12px", borderRadius: "12px", border: "none",
    cursor: "pointer", fontWeight: 700, fontSize: "13px",
    letterSpacing: "0.04em", display: "flex", alignItems: "center",
    justifyContent: "center", gap: "6px",
    transition: "opacity 0.15s, transform 0.1s",
    WebkitTapHighlightColor: "transparent",
    ...(variant === "primary"
      ? { background: "linear-gradient(135deg, #f97316, #fb923c)", color: "#fff" }
      : variant === "danger"
      ? { background: "rgba(220,38,38,0.15)", color: "#ef4444" }
      : { background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary, #888)" }),
  }),
  gpsErrorBanner: {
    marginTop: "12px", padding: "10px 14px", borderRadius: "10px",
    background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.2)",
    fontSize: "12px", color: "#ef4444", textAlign: "center",
  },
  runSavedBanner: {
    marginTop: "12px", padding: "10px 14px", borderRadius: "10px",
    background: "rgba(72,187,120,0.10)", border: "1px solid rgba(72,187,120,0.2)",
    fontSize: "12px", color: "#48bb78", textAlign: "center",
  },
  runPermBadge: {
    padding: "10px 14px", borderRadius: "12px",
    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
    display: "flex", alignItems: "center", gap: "10px",
  },
  runPermText: { flex: 1, fontSize: "12px", color: "var(--color-text-secondary, #888)", lineHeight: 1.4 },
  runPermBtn: {
    background: "rgba(59,130,246,0.15)", color: "#3b82f6",
    border: "none", borderRadius: "8px", padding: "6px 12px",
    fontSize: "11px", fontWeight: 700, cursor: "pointer", flexShrink: 0,
  },
  divider: {
    height: "1px",
    background: "var(--color-border, rgba(255,255,255,0.07))",
    margin: "24px 0 0",
  },
};

// ─── Badge helpers ────────────────────────────────────────────────────────
const BADGE = {
  green:   { bg: "rgba(72,187,120,0.15)",  color: "#48bb78", dot: "#48bb78"  },
  grey:    { bg: "rgba(160,160,160,0.10)", color: "#888",    dot: "#888"     },
  warning: { bg: "rgba(234,163,0,0.12)",   color: "#d4940a", dot: "#d4940a"  },
  danger:  { bg: "rgba(220,38,38,0.10)",   color: "#dc2626", dot: "#dc2626"  },
  info:    { bg: "rgba(59,130,246,0.10)",  color: "#3b82f6", dot: "#3b82f6"  },
};

function Badge({ variant = "grey", children, onClick }) {
  const { bg, color, dot } = BADGE[variant] ?? BADGE.grey;
  return (
    <div onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "4px 10px", borderRadius: "999px",
      background: bg, color, marginTop: "8px", width: "fit-content",
      cursor: onClick ? "pointer" : "default",
      userSelect: "none", WebkitTapHighlightColor: "transparent",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      {children}
    </div>
  );
}

// ─── Step ring SVG ────────────────────────────────────────────────────────
function StepRing({ pct }) {
  const r      = 46;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(pct, 100)) / 100;
  const color  = pct >= 100 ? "#48bb78" : "#63b3ed";
  return (
    <svg viewBox="0 0 110 110" width="110" height="110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text x="55" y="52" textAnchor="middle" fill={color} fontSize="14" fontWeight="800" fontFamily="system-ui">
        {Math.round(pct)}%
      </text>
      <text x="55" y="66" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="system-ui">
        of goal
      </text>
    </svg>
  );
}

// ─── Step permission badge ────────────────────────────────────────────────
function StepBadge({ permissionState, available, requestPermission }) {
  if (permissionState === PermissionState.PROMPT && available === false) return null;
  if (permissionState === PermissionState.PROMPT)
    return <Badge variant="info" onClick={requestPermission}>Enable step tracking</Badge>;
  if (permissionState === PermissionState.DENIED)
    return <Badge variant="danger" onClick={requestPermission}>Permission denied — tap to retry</Badge>;
  if (available === null) return null;
  if (!available) return <Badge variant="warning">No sensor on this device</Badge>;
  return <Badge variant="green">Native sensor</Badge>;
}

// ─── Run Tracker UI ───────────────────────────────────────────────────────
function RunTracker() {
  const {
    runState, elapsedFmt, distance, currentPace, avgPace, calories,
    permissionState, gpsError, isSaving, lastSavedRun,
    start, pause, resume, stop, requestPermission,
  } = useRunTracker();

  const isIdle    = runState === "idle";
  const isRunning = runState === "running";
  const isPaused  = runState === "paused";

  // Location permanently denied
  if (permissionState === RunPermission.DENIED) {
    return (
      <div style={s.runCard}>
        <div style={s.runGlow} />
        <div style={s.runPermBadge}>
          <span style={{ fontSize: 20 }}>📍</span>
          <p style={s.runPermText}>
            Location permission required for GPS distance and pace.
          </p>
          <button style={s.runPermBtn} onClick={requestPermission}>Enable</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.runCard}>
      <div style={s.runGlow} />

      {/* Live metrics */}
      <div style={s.runMetricsRow}>
        <div style={s.runMetric}>
          <div style={s.runMetricValue}>{elapsedFmt}</div>
          <div style={s.runMetricUnit}>time</div>
        </div>
        <div style={s.runMetric}>
          <div style={s.runMetricValue}>{distance.toFixed(2)}</div>
          <div style={s.runMetricUnit}>km</div>
        </div>
        <div style={s.runMetric}>
          <div style={s.runMetricValue}>{currentPace}</div>
          <div style={s.runMetricUnit}>pace /km</div>
        </div>
        <div style={s.runMetric}>
          <div style={s.runMetricValue}>{calories}</div>
          <div style={s.runMetricUnit}>kcal</div>
        </div>
      </div>

      {avgPace !== "--:--" && (
        <>
          <div style={s.runDivider} />
          <div style={{ fontSize: "11px", color: "var(--color-text-secondary,#888)", marginBottom: "14px", textAlign: "center" }}>
            avg pace <strong style={{ color: "#f97316" }}>{avgPace}</strong> /km
          </div>
        </>
      )}

      {/* Controls */}
      <div style={s.runControls}>
        {isIdle && (
          <button style={s.runBtn("primary")} onClick={start}>▶ Start Run</button>
        )}
        {isRunning && (
          <>
            <button style={s.runBtn("secondary")} onClick={pause}>⏸ Pause</button>
            <button
              style={{ ...s.runBtn("danger"), opacity: isSaving ? 0.6 : 1 }}
              onClick={stop}
              disabled={isSaving}
            >
              {isSaving ? "⏳ Saving…" : "■ Stop"}
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button style={s.runBtn("primary")} onClick={resume}>▶ Resume</button>
            <button
              style={{ ...s.runBtn("danger"), opacity: isSaving ? 0.6 : 1 }}
              onClick={stop}
              disabled={isSaving}
            >
              {isSaving ? "⏳ Saving…" : "■ Finish"}
            </button>
          </>
        )}
      </div>

      {/* GPS error */}
      {gpsError && (
        <div style={s.gpsErrorBanner}>⚠ {gpsError}</div>
      )}

      {/* Run saved confirmation */}
      {lastSavedRun && (
        <div style={s.runSavedBanner}>
          ✓ Run saved — {lastSavedRun.distance?.toFixed(2)} km · {lastSavedRun.avgPace} /km avg pace
        </div>
      )}

      {/* First-time permission hint */}
      {permissionState === RunPermission.PROMPT && isIdle && (
        <p style={{ fontSize: "10px", color: "var(--color-text-secondary,#888)", marginTop: "10px", textAlign: "center" }}>
          Tapping Start will request location permission
        </p>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────
export default function HealthPage({
  items, setItems, weightLogs, setWeightLogs,
  addWeight, weightGoal, setWeightGoal,
}) {
  const hasHabits = typeof setItems === "function";

  const { steps, goal, percent, available, permissionState, requestPermission } = useStepCounter();

  const pct      = percent;
  const calories = Math.round(steps * 0.04);
  const km       = (steps * 0.00075).toFixed(2);
  const remain   = Math.max(goal - steps, 0);

  return (
    <div style={s.page}>

      <div style={s.sectionTitle}>Steps Today</div>

      <div style={s.stepCard}>
        <div style={s.stepCardGlow} />
        <div style={s.ringWrap}><StepRing pct={pct} /></div>
        <div style={s.stepInfo}>
          <div style={s.stepCount}>{steps.toLocaleString()}</div>
          <div style={s.stepLabel}>steps</div>
          <div style={s.goalBar}><div style={s.goalBarFill(pct)} /></div>
          <div style={s.goalText}>
            {remain > 0 ? `${remain.toLocaleString()} to goal` : "🎯 Goal reached!"}
          </div>
          <StepBadge
            permissionState={permissionState}
            available={available}
            requestPermission={requestPermission}
          />
        </div>
      </div>

      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statValue}>{km}</div>
          <div style={s.statUnit}>km walked</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{calories}</div>
          <div style={s.statUnit}>kcal</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{goal.toLocaleString()}</div>
          <div style={s.statUnit}>daily goal</div>
        </div>
      </div>

      <div style={s.sectionTitle}>Run Tracker</div>
      <RunTracker />

      <div style={s.sectionTitle}>Run History</div>
      <RunHistory limit={20} />

      {hasHabits && <div style={s.divider} />}

      {hasHabits && (
        <HabitsComponent
          items={items} setItems={setItems}
          weightLogs={weightLogs} setWeightLogs={setWeightLogs}
          addWeight={addWeight} weightGoal={weightGoal} setWeightGoal={setWeightGoal}
        />
      )}

    </div>
  );
}