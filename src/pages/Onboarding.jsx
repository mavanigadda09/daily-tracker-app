/**
 * Onboarding.jsx
 * ─────────────────────────────────────────────────────────────
 * 3-screen transformation ritual for new Phoenix Tracker users.
 * Screen 1 — The Awakening (cinematic intro)
 * Screen 2 — Identity Claim (primary domain selection)
 * Screen 3 — The Naming (confirm name, enter the forge)
 *
 * On complete: writes { primaryDomain, onboardingComplete: true }
 * to Firestore via updateUser, then navigates to /.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";

// ─── Domain options ───────────────────────────────────────────
const DOMAINS = [
  {
    id:       "body",
    label:    "More disciplined physically",
    sub:      "Workouts, movement, health",
    tag:      "BODY",
    color:    "#ef4444",
    ep:       "+50 EP per mission",
  },
  {
    id:       "mind",
    label:    "Mentally sharper",
    sub:      "Focus, learning, reading",
    tag:      "MIND",
    color:    "#facc15",
    ep:       "+30 EP per mission",
  },
  {
    id:       "discipline",
    label:    "More consistent",
    sub:      "Habits, routines, streaks",
    tag:      "DISCIPLINE",
    color:    "#f97316",
    ep:       "+20 EP per mission",
  },
  {
    id:       "all",
    label:    "Complete transformation",
    sub:      "All domains — full evolution",
    tag:      "ALL",
    color:    "#a78bfa",
    ep:       "Balanced EP across all",
  },
];

// ─── Animated ember particles ─────────────────────────────────
function EmberParticles({ count = 18 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id:       i,
      left:     `${5 + Math.random() * 90}%`,
      delay:    `${Math.random() * 6}s`,
      duration: `${4 + Math.random() * 5}s`,
      size:     `${2 + Math.random() * 3}px`,
      opacity:  0.3 + Math.random() * 0.5,
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position:        "absolute",
            bottom:          "-10px",
            left:            p.left,
            width:           p.size,
            height:          p.size,
            borderRadius:    "50%",
            background:      `radial-gradient(circle, #facc15, #f97316)`,
            opacity:         p.opacity,
            animation:       `ob-rise ${p.duration} ${p.delay} ease-in infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Screen 1 — The Awakening ─────────────────────────────────
function ScreenAwakening({ onNext }) {
  const [phase, setPhase] = useState(0);
  // 0 = dark, 1 = line1, 2 = line2, 3 = line3, 4 = cta

  useEffect(() => {
    const timings = [600, 1800, 3000, 4200];
    const timers  = timings.map((t, i) =>
      setTimeout(() => setPhase(i + 1), t)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const lines = [
    "Every Phoenix begins as ash.",
    "You are not here to track habits.",
    "You are here to transform.",
  ];

  return (
    <div className="ob-screen ob-awakening">
      <EmberParticles count={20} />

      <div className="ob-awakening-content">
        <div className="ob-phoenix-mark" aria-hidden="true">
          <div className="ob-phoenix-ring ob-ring-1" />
          <div className="ob-phoenix-ring ob-ring-2" />
          <img src="/phoenix.png" alt="" className="ob-phoenix-img" />
        </div>

        <div className="ob-lines" role="region" aria-label="Introduction">
          {lines.map((line, i) => (
            <p
              key={i}
              className="ob-line"
              style={{ opacity: phase >= i + 1 ? 1 : 0, transform: phase >= i + 1 ? "translateY(0)" : "translateY(16px)" }}
            >
              {line}
            </p>
          ))}
        </div>

        <button
          className="ob-cta"
          onClick={onNext}
          style={{ opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? "translateY(0)" : "translateY(20px)", pointerEvents: phase >= 4 ? "auto" : "none" }}
          aria-label="Begin transformation"
        >
          Begin My Transformation
        </button>

        <p
          className="ob-skip"
          onClick={onNext}
          style={{ opacity: phase >= 2 ? 1 : 0 }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onNext()}
        >
          skip
        </p>
      </div>
    </div>
  );
}

// ─── Screen 2 — Identity Claim ────────────────────────────────
function ScreenIdentity({ onNext, selected, onSelect }) {
  return (
    <div className="ob-screen ob-identity">
      <EmberParticles count={10} />

      <div className="ob-identity-content">
        <div className="ob-step-tag">STEP 1 OF 2</div>

        <h2 className="ob-title">What do you want<br />to become?</h2>
        <p className="ob-subtitle">
          This shapes your mission types and EP rewards.<br />
          You can change this later.
        </p>

        <div className="ob-domain-grid" role="radiogroup" aria-label="Primary transformation domain">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              className={`ob-domain-card${selected === d.id ? " ob-domain-card--selected" : ""}`}
              style={selected === d.id ? { borderColor: d.color, boxShadow: `0 0 0 1px ${d.color}22, 0 8px 32px ${d.color}18` } : {}}
              onClick={() => onSelect(d.id)}
              role="radio"
              aria-checked={selected === d.id}
            >
              <div className="ob-domain-top">
                <span className="ob-domain-tag" style={{ color: d.color, borderColor: `${d.color}40`, background: `${d.color}10` }}>
                  {d.tag}
                </span>
                {selected === d.id && (
                  <span className="ob-domain-check" style={{ color: d.color }}>✓</span>
                )}
              </div>
              <p className="ob-domain-label">{d.label}</p>
              <p className="ob-domain-sub">{d.sub}</p>
              <p className="ob-domain-ep" style={{ color: d.color }}>{d.ep}</p>
            </button>
          ))}
        </div>

        <button
          className="ob-cta"
          onClick={onNext}
          disabled={!selected}
          aria-label="Continue to next step"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Screen 3 — The Naming ────────────────────────────────────
function ScreenNaming({ onComplete, loading, userName, onNameChange }) {
  return (
    <div className="ob-screen ob-naming">
      <EmberParticles count={12} />

      <div className="ob-naming-content">
        <div className="ob-step-tag">STEP 2 OF 2</div>

        <div className="ob-ash-badge" aria-hidden="true">
          <span className="ob-tier-label">ASH</span>
          <span className="ob-tier-sub">Your starting form</span>
        </div>

        <h2 className="ob-title">Every Phoenix<br />needs a name.</h2>
        <p className="ob-subtitle">
          The forge remembers everyone who enters.
        </p>

        <div className="ob-name-field">
          <label className="ob-field-label" htmlFor="ob-name">Your name</label>
          <input
            id="ob-name"
            className="ob-input"
            type="text"
            value={userName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="What shall the forge call you?"
            autoComplete="given-name"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && !loading && userName.trim() && onComplete()}
          />
        </div>

        <div className="ob-identity-preview">
          <div className="ob-preview-row">
            <span className="ob-preview-label">Starting tier</span>
            <span className="ob-preview-val ob-val-ash">Ash</span>
          </div>
          <div className="ob-preview-row">
            <span className="ob-preview-label">First evolution</span>
            <span className="ob-preview-val">500 EP → Spark</span>
          </div>
          <div className="ob-preview-row">
            <span className="ob-preview-label">Ultimate form</span>
            <span className="ob-preview-val ob-val-phoenix">Phoenix</span>
          </div>
        </div>

        <button
          className="ob-cta"
          onClick={onComplete}
          disabled={!userName.trim() || loading}
          aria-busy={loading}
        >
          {loading ? "Igniting the forge…" : "Enter the Forge"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Onboarding component ────────────────────────────────
export default function Onboarding() {
  const navigate              = useNavigate();
  const { user, updateUser }  = useAuth();
  const { showNotification }  = useNotification();

  const [screen,   setScreen]   = useState(0); // 0,1,2
  const [domain,   setDomain]   = useState(null);
  const [name,     setName]     = useState(user?.name || "");
  const [loading,  setLoading]  = useState(false);

  // If already onboarded, don't show this screen
  useEffect(() => {
    if (user?.onboardingComplete) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleComplete = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateUser({
        name:               name.trim(),
        primaryDomain:      domain,
        onboardingComplete: true,
        emberPoints:        0,
        level:              1,
        identityTier:       "Ash",
      });
      showNotification("The forge remembers you. Rise. 🔥", "success");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[Onboarding] complete failed:", err);
      showNotification("Something went wrong. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ob-root">
        <div className="ob-orb ob-orb-1" aria-hidden="true" />
        <div className="ob-orb ob-orb-2" aria-hidden="true" />

        {/* Progress dots */}
        {screen > 0 && (
          <div className="ob-progress" role="progressbar" aria-valuenow={screen} aria-valuemin={0} aria-valuemax={2}>
            {[1, 2].map((s) => (
              <div key={s} className={`ob-dot${screen >= s ? " ob-dot--active" : ""}`} />
            ))}
          </div>
        )}

        <div className="ob-stage">
          {screen === 0 && (
            <ScreenAwakening onNext={() => setScreen(1)} />
          )}
          {screen === 1 && (
            <ScreenIdentity
              onNext={() => setScreen(2)}
              selected={domain}
              onSelect={setDomain}
            />
          )}
          {screen === 2 && (
            <ScreenNaming
              onComplete={handleComplete}
              loading={loading}
              userName={name}
              onNameChange={setName}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.ob-root {
  --ember:   #f97316;
  --gold:    #facc15;
  --ink:     #040710;
  --panel:   #0b1120;
  --glass:   rgba(255,255,255,0.04);
  --border:  rgba(255,255,255,0.08);
  --muted:   rgba(255,255,255,0.38);

  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--ink);
  font-family: 'Syne', sans-serif;
  color: #fff;
  position: relative;
  overflow: hidden;
}

/* Ambient orbs */
.ob-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
}
.ob-orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(249,115,22,0.13) 0%, transparent 70%);
  top: -250px; left: -200px;
  animation: obOrb 16s ease-in-out infinite alternate;
}
.ob-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(250,204,21,0.08) 0%, transparent 70%);
  bottom: -180px; right: -120px;
  animation: obOrb 20s ease-in-out infinite alternate-reverse;
}
@keyframes obOrb {
  from { transform: translate(0,0); }
  to   { transform: translate(30px, 20px); }
}

/* Ember particle rise */
@keyframes ob-rise {
  0%   { transform: translateY(0) scale(1);    opacity: var(--op, 0.5); }
  80%  { opacity: var(--op, 0.5); }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}

/* Progress dots */
.ob-progress {
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}
.ob-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  transition: background 0.3s, width 0.3s;
}
.ob-dot--active {
  width: 20px;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--ember), var(--gold));
}

/* Stage container */
.ob-stage {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  padding: 0 24px;
}

/* ── Screen base ── */
.ob-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  animation: obFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes obFadeUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}

/* ── Screen 1: Awakening ── */
.ob-awakening-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0;
}

.ob-phoenix-mark {
  position: relative;
  width: 100px; height: 100px;
  margin-bottom: 52px;
}
.ob-phoenix-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(249,115,22,0.35);
  animation: obRingPulse 3s ease-in-out infinite;
}
.ob-phoenix-ring.ob-ring-2 {
  inset: -14px;
  border-color: rgba(249,115,22,0.15);
  animation-delay: 0.5s;
}
@keyframes obRingPulse {
  0%,100% { opacity:0.4; transform:scale(1); }
  50%     { opacity:1;   transform:scale(1.06); }
}
.ob-phoenix-img {
  width: 100px; height: 100px;
  object-fit: contain;
  filter: drop-shadow(0 0 24px rgba(249,115,22,0.6));
}

.ob-lines {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 56px;
}
.ob-line {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(1.2rem, 4vw, 1.55rem);
  font-weight: 400;
  color: rgba(255,255,255,0.88);
  margin: 0;
  line-height: 1.3;
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.ob-line:first-child { color: rgba(255,255,255,0.45); font-style: italic; }
.ob-line:last-child {
  background: linear-gradient(135deg, #facc15, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ob-skip {
  margin-top: 24px;
  font-size: 12px;
  color: rgba(255,255,255,0.18);
  cursor: pointer;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: color 0.2s, opacity 0.7s ease;
  user-select: none;
}
.ob-skip:hover { color: rgba(255,255,255,0.4); }

/* ── Screen 2: Identity ── */
.ob-identity-content,
.ob-naming-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0 40px;
}

.ob-step-tag {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--ember);
  text-transform: uppercase;
  margin-bottom: 20px;
  opacity: 0.8;
}

.ob-title {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  font-weight: 400;
  line-height: 1.1;
  text-align: center;
  margin: 0 0 12px;
  color: #fff;
}

.ob-subtitle {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  line-height: 1.6;
  margin: 0 0 32px;
}

.ob-domain-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  margin-bottom: 28px;
}

.ob-domain-card {
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  position: relative;
  font-family: 'Syne', sans-serif;
}
.ob-domain-card:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.15);
}
.ob-domain-card--selected {
  background: rgba(255,255,255,0.05);
}

.ob-domain-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.ob-domain-tag {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid;
}
.ob-domain-check {
  font-size: 14px;
  font-weight: 600;
}
.ob-domain-label {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 4px;
  line-height: 1.3;
}
.ob-domain-sub {
  font-size: 11px;
  color: var(--muted);
  margin: 0 0 8px;
  line-height: 1.4;
}
.ob-domain-ep {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin: 0;
}

/* ── Screen 3: Naming ── */
.ob-ash-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 24px;
  border-radius: 10px;
  border: 1px solid rgba(249,115,22,0.2);
  background: rgba(249,115,22,0.06);
  margin-bottom: 28px;
}
.ob-tier-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--ember);
  text-transform: uppercase;
}
.ob-tier-sub {
  font-size: 11px;
  color: var(--muted);
}

.ob-name-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}
.ob-field-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.ob-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--glass);
  color: #fff;
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.ob-input::placeholder { color: rgba(255,255,255,0.15); }
.ob-input:focus {
  border-color: rgba(249,115,22,0.5);
  box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
}

.ob-identity-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 28px;
}
.ob-preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.ob-preview-row:last-child { border-bottom: none; }
.ob-preview-label {
  font-size: 12px;
  color: var(--muted);
}
.ob-preview-val {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
}
.ob-val-ash { color: rgba(255,255,255,0.4); }
.ob-val-phoenix {
  background: linear-gradient(135deg, #facc15, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 600;
}

/* ── Shared CTA button ── */
.ob-cta {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #f97316, #facc15);
  color: #050810;
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 28px rgba(249,115,22,0.3);
}
.ob-cta:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 8px 36px rgba(249,115,22,0.4);
}
.ob-cta:active:not(:disabled) { transform: translateY(0); }
.ob-cta:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: none;
}
.ob-cta:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

@media (max-width: 400px) {
  .ob-domain-grid { grid-template-columns: 1fr; }
  .ob-stage { padding: 0 16px; }
}
`;