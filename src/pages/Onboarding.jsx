/**
 * Onboarding.jsx
 * ─────────────────────────────────────────────────────────────
 * Multi-step onboarding flow: Name → Goal → Focus → Done
 *
 * Improvements over original:
 *
 * UX
 *  • 3 focused steps instead of one dense form — reduces cognitive load
 *  • Step indicator with animated progress bar
 *  • Each step animates in (slide + fade) and out smoothly
 *  • Focus card selection with icons and descriptions
 *  • "Done" celebration step before handing off
 *
 * Code
 *  • CSS-in-JS string (lp-* namespace) — no inline style objects
 *  • Validation extracted to pure validate() per step
 *  • localStorage write isolated to saveUser() helper
 *  • Consistent with Login.jsx patterns (same font, same CSS approach)
 *
 * Accessibility
 *  • aria-label on every input and button group
 *  • aria-current="step" on active step indicator
 *  • role="alert" on error messages
 *  • aria-pressed on focus selection buttons
 *  • Enter key advances steps
 *  • Focus auto-set on mount of each step
 */

import { useState, useEffect, useRef } from "react";

// ─── Config ───────────────────────────────────────────────────

const FOCUS_OPTIONS = [
  {
    id:    "productivity",
    icon:  "◈",
    label: "Productivity",
    desc:  "Tasks, deep work, habits",
  },
  {
    id:    "fitness",
    icon:  "◉",
    label: "Fitness",
    desc:  "Steps, weight, workouts",
  },
  {
    id:    "finance",
    icon:  "◫",
    label: "Finance",
    desc:  "Budget, goals, savings",
  },
];

const TOTAL_STEPS = 3; // name, goal+focus, done

// ─── Helpers ──────────────────────────────────────────────────

function validate(step, { name, goal }) {
  if (step === 0 && !name.trim()) return "Enter your name to continue.";
  // goal is optional — no validation needed
  return null;
}

function saveUser(userData) {
  try {
    localStorage.setItem("user", JSON.stringify(userData));
  } catch {
    /* private-browsing or quota — carry on */
  }
}

// ─── Component ────────────────────────────────────────────────

export default function Onboarding({ onComplete }) {
  const [step,    setStep]    = useState(0);
  const [name,    setName]    = useState("");
  const [goal,    setGoal]    = useState("");
  const [focus,   setFocus]   = useState("productivity");
  const [error,   setError]   = useState("");
  const [leaving, setLeaving] = useState(false);

  const primaryInputRef = useRef(null);

  // Auto-focus the primary input on each step
  useEffect(() => {
    const t = setTimeout(() => primaryInputRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, [step]);

  // ── Navigation ─────────────────────────────────────────────

  const advance = () => {
    const err = validate(step, { name, goal });
    if (err) { setError(err); return; }
    setError("");

    if (step < TOTAL_STEPS - 1) {
      setLeaving(true);
      setTimeout(() => { setStep((s) => s + 1); setLeaving(false); }, 260);
    } else {
      // Final step — persist and hand off
      const user = { name: name.trim(), goal: goal.trim(), focus };
      saveUser(user);
      onComplete(user);
    }
  };

  const back = () => {
    if (step === 0) return;
    setError("");
    setLeaving(true);
    setTimeout(() => { setStep((s) => s - 1); setLeaving(false); }, 260);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") advance();
  };

  // ── Step content ───────────────────────────────────────────

  const steps = [
    // Step 0 — Name
    <div key="name" className="ob-step">
      <div className="ob-step-icon" aria-hidden="true">🔥</div>
      <h2 className="ob-step-title">What should we call you?</h2>
      <p className="ob-step-sub">This is how Phoenix Tracker will greet you.</p>
      <input
        ref={primaryInputRef}
        id="ob-name"
        className={`ob-input${error ? " ob-input--error" : ""}`}
        type="text"
        value={name}
        placeholder="Your name"
        autoComplete="given-name"
        aria-label="Your name"
        aria-invalid={!!error}
        aria-describedby={error ? "ob-name-err" : undefined}
        onChange={(e) => { setName(e.target.value); setError(""); }}
        onKeyDown={handleKeyDown}
      />
      {error && (
        <p id="ob-name-err" className="ob-error" role="alert">{error}</p>
      )}
    </div>,

    // Step 1 — Goal + Focus
    <div key="goal" className="ob-step">
      <div className="ob-step-icon" aria-hidden="true">🎯</div>
      <h2 className="ob-step-title">What are you working towards?</h2>
      <p className="ob-step-sub">Optional — you can update this any time.</p>

      <input
        ref={primaryInputRef}
        className="ob-input"
        type="text"
        value={goal}
        placeholder="e.g. Study 2h daily, lose 5 kg…"
        aria-label="Your goal"
        onChange={(e) => setGoal(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <p className="ob-focus-label">Primary focus area</p>
      <div
        className="ob-focus-grid"
        role="group"
        aria-label="Choose your primary focus"
      >
        {FOCUS_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`ob-focus-btn${focus === opt.id ? " ob-focus-btn--active" : ""}`}
            aria-pressed={focus === opt.id}
            onClick={() => setFocus(opt.id)}
          >
            <span className="ob-focus-icon" aria-hidden="true">{opt.icon}</span>
            <span className="ob-focus-name">{opt.label}</span>
            <span className="ob-focus-desc">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>,

    // Step 2 — Done
    <div key="done" className="ob-step ob-step--center">
      <div className="ob-done-ring" aria-hidden="true">
        <span className="ob-done-emoji">✦</span>
      </div>
      <h2 className="ob-step-title">You're all set, {name.split(" ")[0]}.</h2>
      <p className="ob-step-sub">
        Your Phoenix profile is ready. Time to rise.
      </p>
      <div className="ob-summary">
        {goal && (
          <div className="ob-summary-row">
            <span className="ob-summary-key">Goal</span>
            <span className="ob-summary-val">{goal}</span>
          </div>
        )}
        <div className="ob-summary-row">
          <span className="ob-summary-key">Focus</span>
          <span className="ob-summary-val">
            {FOCUS_OPTIONS.find((o) => o.id === focus)?.label}
          </span>
        </div>
      </div>
    </div>,
  ];

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>

      <div className="ob-root" role="main">
        <div className="ob-orb ob-orb-1" aria-hidden="true" />
        <div className="ob-orb ob-orb-2" aria-hidden="true" />

        <div className="ob-card" role="region" aria-label="Onboarding">

          {/* Progress bar */}
          <div className="ob-progress" aria-label="Setup progress">
            <div
              className="ob-progress-fill"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="ob-dots" role="list" aria-label="Steps">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                role="listitem"
                aria-current={i === step ? "step" : undefined}
                className={`ob-dot${i === step ? " ob-dot--active" : i < step ? " ob-dot--done" : ""}`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className={`ob-content${leaving ? " ob-content--leaving" : ""}`}>
            {steps[step]}
          </div>

          {/* Actions */}
          <div className="ob-actions">
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <button
                type="button"
                className="ob-back-btn"
                onClick={back}
                aria-label="Go back"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              className="ob-primary-btn"
              onClick={advance}
              aria-label={step === TOTAL_STEPS - 1 ? "Launch Phoenix Tracker" : "Continue to next step"}
            >
              {step === TOTAL_STEPS - 1 ? "Launch Phoenix →" : "Continue →"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Syne:wght@400;500;600&display=swap');

.ob-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg, #040710);
  font-family: 'Syne', sans-serif;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Ambient orbs */
.ob-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.ob-orb-1 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(249,115,22,0.13) 0%, transparent 70%);
  top: -160px; left: -120px;
  animation: obOrb 14s ease-in-out infinite alternate;
}
.ob-orb-2 {
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(250,204,21,0.08) 0%, transparent 70%);
  bottom: -120px; right: -80px;
  animation: obOrb 18s ease-in-out infinite alternate-reverse;
}
@keyframes obOrb {
  from { transform: translate(0,0); }
  to   { transform: translate(24px, 16px); }
}

/* Card */
.ob-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 460px;
  background: var(--card, #0b1120);
  border: 1px solid rgba(249,115,22,0.15);
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.025),
    0 32px 100px rgba(0,0,0,0.8);
  animation: obRise 0.6s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes obRise {
  from { opacity:0; transform: translateY(28px) scale(0.97); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}

/* Progress bar */
.ob-progress {
  height: 3px;
  background: rgba(255,255,255,0.06);
  width: 100%;
}
.ob-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f97316, #facc15);
  border-radius: 0 2px 2px 0;
  transition: width 0.45s cubic-bezier(0.4,0,0.2,1);
}

/* Step dots */
.ob-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 20px 0 0;
}
.ob-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  transition: all 0.3s ease;
}
.ob-dot--active {
  background: #f97316;
  width: 20px;
  border-radius: 3px;
}
.ob-dot--done {
  background: rgba(250,204,21,0.5);
}

/* Content area */
.ob-content {
  padding: 28px 32px 8px;
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.ob-content--leaving {
  opacity: 0;
  transform: translateX(-12px);
}

/* Step */
.ob-step {
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: obStepIn 0.35s 0.1s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes obStepIn {
  from { opacity:0; transform: translateX(16px); }
  to   { opacity:1; transform: translateX(0); }
}
.ob-step--center {
  align-items: center;
  text-align: center;
}

.ob-step-icon {
  font-size: 28px;
  line-height: 1;
  margin-bottom: 2px;
}
.ob-step-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.55rem;
  font-weight: 400;
  color: var(--text, #fff);
  margin: 0;
  line-height: 1.2;
}
.ob-step-sub {
  font-size: 13px;
  color: var(--text-muted, rgba(255,255,255,0.4));
  margin: 0 0 6px;
  line-height: 1.5;
}

/* Input */
.ob-input {
  width: 100%;
  padding: 13px 16px;
  border-radius: 10px;
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  background: rgba(255,255,255,0.04);
  color: var(--text, #fff);
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.ob-input::placeholder { color: rgba(255,255,255,0.2); }
.ob-input:focus {
  border-color: rgba(249,115,22,0.5);
  box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
}
.ob-input--error {
  border-color: rgba(239,68,68,0.5);
}
.ob-input:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }

/* Error */
.ob-error {
  font-size: 12px;
  color: #f87171;
  margin: 0;
}

/* Focus label */
.ob-focus-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 4px 0 0;
}

/* Focus grid */
.ob-focus-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.ob-focus-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 14px 8px;
  border-radius: 12px;
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  background: rgba(255,255,255,0.03);
  color: var(--text, #fff);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
  text-align: center;
}
.ob-focus-btn:hover:not(.ob-focus-btn--active) {
  border-color: rgba(249,115,22,0.3);
  background: rgba(249,115,22,0.05);
}
.ob-focus-btn:active { transform: scale(0.97); }
.ob-focus-btn--active {
  border-color: rgba(249,115,22,0.6);
  background: rgba(249,115,22,0.12);
}
.ob-focus-btn:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }
.ob-focus-icon {
  font-size: 18px;
  line-height: 1;
  color: var(--accent, #f97316);
}
.ob-focus-btn--active .ob-focus-icon { color: #facc15; }
.ob-focus-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.ob-focus-desc {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  line-height: 1.3;
}
.ob-focus-btn--active .ob-focus-desc { color: rgba(255,255,255,0.6); }

/* Done step */
.ob-done-ring {
  width: 72px; height: 72px;
  border-radius: 50%;
  border: 2px solid rgba(249,115,22,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  animation: obRingPulse 2.5s ease-in-out infinite;
}
@keyframes obRingPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
  50%     { box-shadow: 0 0 0 8px rgba(249,115,22,0.1); }
}
.ob-done-emoji {
  font-size: 26px;
  color: #f97316;
  animation: obSpin 6s linear infinite;
}
@keyframes obSpin { to { transform: rotate(360deg); } }

/* Summary card */
.ob-summary {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
  text-align: left;
}
.ob-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.ob-summary-key {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.35);
}
.ob-summary-val {
  font-size: 13px;
  font-weight: 500;
  color: var(--text, #fff);
  text-align: right;
}

/* Actions */
.ob-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 20px 32px 28px;
}
.ob-back-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.45);
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  flex-shrink: 0;
}
.ob-back-btn:hover { border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); }
.ob-back-btn:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }

.ob-primary-btn {
  flex: 1;
  padding: 13px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #f97316, #facc15);
  color: #050810;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  min-height: 46px;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 20px rgba(249,115,22,0.25);
}
.ob-primary-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(249,115,22,0.35);
}
.ob-primary-btn:active { transform: translateY(0); }
.ob-primary-btn:focus-visible { outline: 2px solid #facc15; outline-offset: 3px; }

/* Mobile */
@media (max-width: 480px) {
  .ob-content { padding: 22px 22px 8px; }
  .ob-actions  { padding: 18px 22px 24px; }
  .ob-focus-grid { grid-template-columns: 1fr 1fr 1fr; }
  .ob-focus-btn { padding: 12px 4px; }
  .ob-step-title { font-size: 1.35rem; }
}
`;
