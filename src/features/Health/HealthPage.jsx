/**
 * HealthPage.jsx — Unified Health & Habits Dashboard
 *
 * Merges:
 *  - Native Android step counter (TYPE_STEP_COUNTER via StepCounterPlugin)
 *  - Full Habits dashboard (all props passed from routes via appData)
 *
 * Route: /health
 * Props: all Habits props (items, setItems, weightLogs, setWeightLogs,
 *         addWeight, weightGoal, setWeightGoal) are optional —
 *         if not passed, the habits section gracefully hides.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { registerPlugin } from "@capacitor/core";

// ─── Native step counter plugin ────────────────────────────────────────────
const StepCounter = registerPlugin("StepCounter");

const STEP_GOAL = 10_000;
const STORAGE_KEY = "phoenix_steps_v1";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadPersistedSteps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSteps(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

// ─── Styles ────────────────────────────────────────────────────────────────
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
  // ── Step Ring card ──
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
    position: "absolute",
    top: "-40px",
    right: "-40px",
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,179,237,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ringWrap: {
    flexShrink: 0,
    position: "relative",
    width: "110px",
    height: "110px",
  },
  stepInfo: {
    flex: 1,
    minWidth: 0,
  },
  stepCount: {
    fontSize: "36px",
    fontWeight: 800,
    lineHeight: 1,
    color: "var(--color-text, #f0f0f0)",
    letterSpacing: "-0.02em",
  },
  stepLabel: {
    fontSize: "12px",
    color: "var(--color-text-secondary, #888)",
    marginTop: "2px",
    marginBottom: "10px",
  },
  goalBar: {
    height: "6px",
    borderRadius: "3px",
    background: "var(--color-border, rgba(255,255,255,0.08))",
    overflow: "hidden",
    marginBottom: "6px",
  },
  goalBarFill: (pct) => ({
    height: "100%",
    borderRadius: "3px",
    width: `${Math.min(pct, 100)}%`,
    background:
      pct >= 100
        ? "linear-gradient(90deg, #48bb78, #38a169)"
        : "linear-gradient(90deg, #63b3ed, #4299e1)",
    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
  }),
  goalText: {
    fontSize: "11px",
    color: "var(--color-text-secondary, #888)",
  },
  badge: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "3px 8px",
    borderRadius: "999px",
    background: color === "green" ? "rgba(72,187,120,0.15)" : "rgba(160,160,160,0.1)",
    color: color === "green" ? "#48bb78" : "#888",
    marginTop: "8px",
    width: "fit-content",
  }),
  dot: (color) => ({
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: color === "green" ? "#48bb78" : "#888",
  }),
  statsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    marginTop: "12px",
  },
  statCard: {
    background: "var(--color-surface, #1a1a2e)",
    borderRadius: "14px",
    padding: "14px 10px",
    textAlign: "center",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: 800,
    color: "var(--color-text, #f0f0f0)",
    lineHeight: 1,
  },
  statUnit: {
    fontSize: "10px",
    color: "var(--color-text-secondary, #888)",
    marginTop: "4px",
  },
  divider: {
    height: "1px",
    background: "var(--color-border, rgba(255,255,255,0.07))",
    margin: "24px 0 0",
  },
};

// ─── SVG Ring ──────────────────────────────────────────────────────────────
function StepRing({ pct }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(pct, 100)) / 100;
  const color = pct >= 100 ? "#48bb78" : "#63b3ed";

  return (
    <svg viewBox="0 0 110 110" width="110" height="110">
      <circle
        cx="55" cy="55" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="10"
      />
      <circle
        cx="55" cy="55" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text
        x="55" y="52"
        textAnchor="middle"
        fill={color}
        fontSize="14"
        fontWeight="800"
        fontFamily="system-ui"
      >
        {Math.round(pct)}%
      </text>
      <text
        x="55" y="66"
        textAnchor="middle"
        fill="rgba(255,255,255,0.45)"
        fontSize="9"
        fontFamily="system-ui"
      >
        of goal
      </text>
    </svg>
  );
}

// ─── Step Section ──────────────────────────────────────────────────────────
function StepSection() {
  const [steps, setSteps]           = useState(0);
  const [sensorAvail, setSensorAvail] = useState(null); // null=checking, true/false
  const baselineRef = useRef(null);
  const todayKey    = getTodayKey();

  // Load persisted baseline
  useEffect(() => {
    const saved = loadPersistedSteps();
    if (saved?.date === todayKey && saved.baseline != null) {
      baselineRef.current = saved.baseline;
      if (saved.steps != null) setSteps(saved.steps);
    }
  }, [todayKey]);

  const handleStepUpdate = useCallback(
    (event) => {
      const raw = Number(event.steps);
      if (isNaN(raw) || raw < 0) return;

      // First reading of the day — set baseline
      if (baselineRef.current === null) {
        baselineRef.current = raw;
        persistSteps({ date: todayKey, baseline: raw, steps: 0 });
        setSteps(0);
        return;
      }

      // If raw < baseline (device rebooted), reset baseline
      const baseline =
        raw < baselineRef.current ? raw : baselineRef.current;
      if (raw < baselineRef.current) {
        baselineRef.current = raw;
      }

      const todaySteps = raw - baseline;
      setSteps(todaySteps);
      persistSteps({ date: todayKey, baseline, steps: todaySteps });
    },
    [todayKey]
  );

  useEffect(() => {
    let listenerHandle = null;

    async function init() {
      try {
        const { available } = await StepCounter.isAvailable();
        setSensorAvail(available);
        if (!available) return;

        await StepCounter.start();

        listenerHandle = await StepCounter.addListener("stepUpdate", handleStepUpdate);

        // Kick off an immediate read
        const result = await StepCounter.getSteps();
        if (result?.steps != null && result.steps >= 0) {
          handleStepUpdate({ steps: result.steps });
        }
      } catch {
        setSensorAvail(false);
      }
    }

    init();

    return () => {
      listenerHandle?.remove?.();
      StepCounter.stop?.().catch?.(() => {});
    };
  }, [handleStepUpdate]);

  const pct      = (steps / STEP_GOAL) * 100;
  const calories = Math.round(steps * 0.04);
  const km       = (steps * 0.00075).toFixed(2);
  const remain   = Math.max(STEP_GOAL - steps, 0);

  return (
    <>
      <div style={s.sectionTitle}>Steps Today</div>

      <div style={s.stepCard}>
        <div style={s.stepCardGlow} />
        <div style={s.ringWrap}>
          <StepRing pct={pct} />
        </div>
        <div style={s.stepInfo}>
          <div style={s.stepCount}>{steps.toLocaleString()}</div>
          <div style={s.stepLabel}>steps</div>
          <div style={s.goalBar}>
            <div style={s.goalBarFill(pct)} />
          </div>
          <div style={s.goalText}>
            {remain > 0
              ? `${remain.toLocaleString()} to goal`
              : "🎯 Goal reached!"}
          </div>
          {sensorAvail === null ? null : (
            <div style={s.badge(sensorAvail ? "green" : "grey")}>
              <div style={s.dot(sensorAvail ? "green" : "grey")} />
              {sensorAvail ? "Native Sensor" : "No Sensor"}
            </div>
          )}
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
          <div style={s.statValue}>{STEP_GOAL.toLocaleString()}</div>
          <div style={s.statUnit}>daily goal</div>
        </div>
      </div>
    </>
  );
}

// ─── Inline mini-Habits (reuses your existing Habits component) ─────────────
// We just import and render Habits below the step section.
// All required props are forwarded from the route.
import HabitsComponent from "../../habits/Habits.jsx";

// ─── Main export ───────────────────────────────────────────────────────────
export default function HealthPage({
  items,
  setItems,
  weightLogs,
  setWeightLogs,
  addWeight,
  weightGoal,
  setWeightGoal,
}) {
  const hasHabits = typeof setItems === "function";

  return (
    <div style={s.page}>
      {/* ── Step Counter ── */}
      <StepSection />

      {/* ── Divider ── */}
      {hasHabits && <div style={s.divider} />}

      {/* ── Habits Dashboard ── */}
      {hasHabits && (
        <>
          <HabitsComponent
            items={items}
            setItems={setItems}
            weightLogs={weightLogs}
            setWeightLogs={setWeightLogs}
            addWeight={addWeight}
            weightGoal={weightGoal}
            setWeightGoal={setWeightGoal}
          />
        </>
      )}
    </div>
  );
}