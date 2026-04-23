import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/* ─────────────────────────────────────────────
   CSS-in-JS styles injected once on mount
───────────────────────────────────────────── */
const STYLES = `
  :root {
    --ember: #f97316;
    --ember-dim: rgba(249,115,22,0.18);
    --gold: #facc15;
    --gold-dim: rgba(250,204,21,0.18);
    --crimson: #ef4444;
    --crimson-dim: rgba(239,68,68,0.18);
    --ink: #040710;
    --ink-mid: #0d1424;
    --ink-surface: #111827;
    --text-primary: #f1f5f9;
    --text-muted: #94a3b8;
    --font-display: 'DM Serif Display', serif;
    --font-body: 'Syne', sans-serif;
  }

  .ob-root {
    min-height: 100dvh;
    background: var(--ink);
    color: var(--text-primary);
    font-family: var(--font-body);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* ── Particle canvas ── */
  .ob-particles {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Top header bar ── */
  .ob-header {
    position: relative;
    z-index: 10;
    padding: 20px 24px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ob-forge-label {
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--accent, var(--ember));
    opacity: 0.9;
  }

  .ob-progress-track {
    height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 99px;
    overflow: hidden;
    position: relative;
  }

  .ob-progress-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--accent, var(--ember)), var(--accent-light, #fbbf24));
    box-shadow: 0 0 10px var(--accent, var(--ember));
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ob-progress-pct {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--accent, var(--ember));
    text-align: right;
    margin-top: 4px;
  }

  /* ── Scan text ── */
  .ob-scan-text {
    position: relative;
    z-index: 10;
    padding: 0 24px 16px;
    font-style: italic;
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    min-height: 20px;
    overflow: hidden;
  }

  .ob-scan-text::before {
    content: '▶ ';
    color: var(--accent, var(--ember));
    font-style: normal;
    animation: blink 1.1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* ── Main content area ── */
  .ob-content {
    flex: 1;
    position: relative;
    z-index: 10;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    padding-bottom: 100px;
  }

  /* ── Question card ── */
  .ob-card {
    background: linear-gradient(135deg, var(--ink-mid) 0%, rgba(13,20,36,0.95) 100%);
    border-radius: 16px;
    padding: 24px;
    box-shadow:
      0 0 0 1px var(--accent, var(--ember)),
      0 0 24px var(--accent-dim, rgba(249,115,22,0.3)),
      inset 0 1px 0 rgba(255,255,255,0.05);
    animation: cardIn 0.45s cubic-bezier(0.2, 0, 0, 1) both;
    position: relative;
    overflow: hidden;
  }

  .ob-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent, var(--ember)), transparent);
    opacity: 0.6;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(22px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)  scale(1); }
  }

  .ob-q-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--accent, var(--ember));
    margin-bottom: 10px;
  }

  .ob-q-text {
    font-family: var(--font-display);
    font-size: 20px;
    line-height: 1.3;
    color: var(--text-primary);
    margin-bottom: 20px;
  }

  /* ── Name input ── */
  .ob-name-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(249,115,22,0.3);
    border-radius: 10px;
    padding: 14px 16px;
    font-family: var(--font-body);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .ob-name-input::placeholder {
    color: var(--text-muted);
    font-style: italic;
  }

  .ob-name-input:focus {
    border-color: var(--accent, var(--ember));
    box-shadow: 0 0 0 3px var(--accent-dim, rgba(249,115,22,0.2));
  }

  /* ── Radio rows ── */
  .ob-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ob-option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .ob-option:hover {
    background: var(--accent-dim, rgba(249,115,22,0.1));
    border-color: rgba(249,115,22,0.35);
  }

  .ob-option.selected {
    background: var(--accent-dim, rgba(249,115,22,0.15));
    border-color: var(--accent, var(--ember));
    box-shadow: 0 0 12px var(--accent-dim, rgba(249,115,22,0.2));
  }

  .ob-radio-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color 0.2s;
  }

  .ob-option.selected .ob-radio-dot {
    border-color: var(--accent, var(--ember));
  }

  .ob-radio-dot-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent, var(--ember));
    box-shadow: 0 0 6px var(--accent, var(--ember));
    opacity: 0;
    transform: scale(0);
    transition: opacity 0.2s, transform 0.2s;
  }

  .ob-option.selected .ob-radio-dot-inner {
    opacity: 1;
    transform: scale(1);
  }

  .ob-option-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
  }

  .ob-option.selected .ob-option-text {
    color: var(--accent, var(--ember));
  }

  /* ── Bottom nav ── */
  .ob-bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 20;
    padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
    display: flex;
    gap: 12px;
    background: linear-gradient(transparent, var(--ink) 35%);
  }

  .ob-btn-back {
    flex: 0 0 auto;
    padding: 15px 20px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    color: var(--text-muted);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ob-btn-back:hover {
    border-color: rgba(255,255,255,0.3);
    color: var(--text-primary);
  }

  .ob-btn-primary {
    flex: 1;
    padding: 15px 20px;
    background: linear-gradient(135deg, var(--accent, var(--ember)) 0%, var(--accent-light, #fb923c) 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px var(--accent-dim, rgba(249,115,22,0.4));
    position: relative;
    overflow: hidden;
  }

  .ob-btn-primary::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
    pointer-events: none;
  }

  .ob-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 28px var(--accent-dim, rgba(249,115,22,0.55));
  }

  .ob-btn-primary:active {
    transform: translateY(0);
  }

  .ob-btn-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  /* ─────────────────────────────────────────
     INTERSTITIAL — PHOENIX DETECTED
  ───────────────────────────────────────── */
  .ob-interstitial {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    animation: fadeIn 0.4s ease both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .ob-interstitial-tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--ember);
    margin-bottom: 28px;
    animation: slideUp 0.5s 0.2s both;
  }

  .ob-interstitial-title {
    font-family: var(--font-display);
    font-size: 36px;
    text-align: center;
    color: var(--text-primary);
    margin-bottom: 8px;
    animation: slideUp 0.5s 0.3s both;
  }

  .ob-interstitial-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    margin-bottom: 40px;
    text-align: center;
    animation: slideUp 0.5s 0.4s both;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* CSS-only phoenix silhouette */
  .ob-silhouette {
    width: 120px;
    height: 160px;
    position: relative;
    margin-bottom: 40px;
    animation: slideUp 0.5s 0.35s both;
  }

  /* Body */
  .ob-silhouette::before {
    content: '';
    position: absolute;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 90px;
    background: var(--ember);
    clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
    box-shadow: 0 0 30px rgba(249,115,22,0.6), 0 0 60px rgba(249,115,22,0.3);
    opacity: 0.9;
  }

  /* Head */
  .ob-silhouette-head {
    position: absolute;
    top: 16px; left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 28px;
    background: var(--ember);
    border-radius: 50% 50% 40% 40%;
    box-shadow: 0 0 20px rgba(249,115,22,0.8);
  }

  /* Left wing */
  .ob-silhouette-wing-l {
    position: absolute;
    top: 30px; left: 0;
    width: 52px;
    height: 70px;
    background: linear-gradient(135deg, var(--gold) 0%, var(--ember) 60%, transparent 100%);
    clip-path: polygon(100% 0%, 0% 30%, 20% 100%, 100% 80%);
    box-shadow: 0 0 20px rgba(250,204,21,0.4);
    opacity: 0.85;
  }

  /* Right wing */
  .ob-silhouette-wing-r {
    position: absolute;
    top: 30px; right: 0;
    width: 52px;
    height: 70px;
    background: linear-gradient(225deg, var(--gold) 0%, var(--ember) 60%, transparent 100%);
    clip-path: polygon(0% 0%, 100% 30%, 80% 100%, 0% 80%);
    box-shadow: 0 0 20px rgba(250,204,21,0.4);
    opacity: 0.85;
  }

  /* Tail feathers */
  .ob-silhouette-tail {
    position: absolute;
    bottom: -20px; left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 30px;
    background: linear-gradient(180deg, var(--ember) 0%, rgba(249,115,22,0) 100%);
    clip-path: polygon(15% 0%, 50% 100%, 85% 0%, 100% 50%, 50% 85%, 0% 50%);
    opacity: 0.7;
  }

  /* Ember glow ring */
  .ob-glow-ring {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%);
    pointer-events: none;
    animation: pulseGlow 2.5s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
    50%       { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
  }

  /* Loading bar on interstitials */
  .ob-load-track {
    width: 220px;
    height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 99px;
    overflow: hidden;
    animation: slideUp 0.5s 0.5s both;
  }

  .ob-load-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--ember), var(--gold));
    box-shadow: 0 0 8px var(--ember);
    border-radius: 99px;
    animation: loadFill 2.2s cubic-bezier(0.4,0,0.2,1) forwards;
  }

  @keyframes loadFill {
    0%   { width: 0%; }
    60%  { width: 80%; }
    85%  { width: 92%; }
    100% { width: 100%; }
  }

  /* ─────────────────────────────────────────
     INTERSTITIAL — FORGE CALIBRATING
  ───────────────────────────────────────── */
  .ob-calibrate-status {
    font-size: 12px;
    letter-spacing: 0.1em;
    color: var(--ember);
    margin-top: 20px;
    min-height: 18px;
    animation: slideUp 0.5s 0.6s both;
    text-align: center;
  }

  /* ─────────────────────────────────────────
     FORGE READY
  ───────────────────────────────────────── */
  .ob-ready-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px 120px;
    position: relative;
    z-index: 10;
    text-align: center;
    gap: 28px;
  }

  .ob-ready-tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--ember);
    animation: slideUp 0.5s 0.1s both;
  }

  .ob-ready-title {
    font-family: var(--font-display);
    font-size: 42px;
    background: linear-gradient(135deg, var(--gold) 0%, var(--ember) 55%, #fb7185 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
    animation: slideUp 0.5s 0.2s both;
  }

  .ob-ready-name {
    font-family: var(--font-display);
    font-size: 28px;
    background: linear-gradient(135deg, var(--gold), var(--ember));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: slideUp 0.5s 0.3s both;
  }

  .ob-ready-stats {
    display: flex;
    gap: 12px;
    animation: slideUp 0.5s 0.4s both;
  }

  .ob-stat-card {
    flex: 1;
    background: linear-gradient(135deg, var(--ink-mid), rgba(13,20,36,0.9));
    border: 1px solid rgba(249,115,22,0.3);
    border-radius: 14px;
    padding: 16px 12px;
    box-shadow: 0 0 16px rgba(249,115,22,0.1);
  }

  .ob-stat-value {
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--ember);
    margin-bottom: 4px;
  }

  .ob-stat-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .ob-ready-tier {
    font-size: 13px;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    animation: slideUp 0.5s 0.5s both;
  }

  .ob-ready-tier span {
    color: var(--ember);
    font-weight: 700;
  }

  /* ── Utility ── */
  .ob-screen-enter {
    animation: cardIn 0.4s cubic-bezier(0.2,0,0,1) both;
  }
`;

/* ─────────────────────────────────────────────
   Particle canvas hook
───────────────────────────────────────────── */
function useEmberParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 28 }, () => makeParticle());

    function makeParticle() {
      return {
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 10,
        r: Math.random() * 2 + 0.5,
        vy: -(Math.random() * 0.8 + 0.3),
        vx: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
        hue: Math.random() > 0.5 ? 25 : 45, // ember orange or gold
      };
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        p.alpha -= 0.0018;

        if (p.y < -10 || p.alpha <= 0) {
          Object.assign(p, makeParticle());
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = `hsl(${p.hue}, 95%, 65%)`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `hsl(${p.hue}, 95%, 65%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    }

    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
}

/* ─────────────────────────────────────────────
   Data — questions & section config
───────────────────────────────────────────── */
const QUESTIONS = [
  {
    id: "name",
    label: "FORGE REGISTRATION — IDENTITY",
    question: "What shall the Forge call you?",
    type: "text",
    placeholder: "Enter your forge name...",
    scan: "Igniting transformation sequence...",
  },
  {
    id: "primaryDomain",
    label: "FORGE REGISTRATION — DOMAIN",
    question: "What is your primary transformation?",
    type: "radio",
    options: ["Body", "Mind", "Discipline", "All Domains"],
    scan: "Calibrating ember output...",
  },
  {
    id: "commitmentLevel",
    label: "FORGE REGISTRATION — COMMITMENT",
    question: "How committed are you to this transformation?",
    type: "radio",
    options: ["Exploring", "Building Habits", "Serious", "LEGENDARY"],
    scan: "Measuring forge temperature...",
    accentKey: "gold",
  },
  {
    id: "motivationDriver",
    label: "FORGE REGISTRATION — DRIVE",
    question: "What drives you the most?",
    type: "radio",
    options: [
      "EP rewards",
      "Identity evolution",
      "Daily streaks",
      "Completing missions",
    ],
    scan: "Scanning motivational core...",
    accentKey: "gold",
  },
  {
    id: "blockerHistory",
    label: "FORGE REGISTRATION — HISTORY",
    question: "What has held you back before?",
    type: "radio",
    options: [
      "Lack of consistency",
      "Lack of motivation",
      "Time constraints",
      "No system",
    ],
    scan: "Analyzing blocker patterns...",
    accentKey: "crimson",
  },
];

/* Interstitial configs */
const INTERSTITIALS = {
  phoenixDetected: {
    tag: "// SYSTEM ALERT //",
    title: "PHOENIX DETECTED",
    subtitle: "Your potential has been recognized",
    type: "phoenix",
  },
  forgeCalibrating: {
    tag: "// CALIBRATION //",
    title: "FORGE CALIBRATING",
    subtitle: "Preparing your personal transformation matrix",
    type: "calibrate",
    messages: [
      "Analyzing transformation DNA...",
      "Calibrating ember output...",
      "Initializing identity matrix...",
      "Forging your path...",
    ],
  },
};

/* Accent tokens per section */
const ACCENT = {
  ember:   { main: "#f97316", light: "#fb923c", dim: "rgba(249,115,22,0.2)" },
  gold:    { main: "#facc15", light: "#fde047", dim: "rgba(250,204,21,0.2)" },
  crimson: { main: "#ef4444", light: "#f87171", dim: "rgba(239,68,68,0.2)"  },
};

function getAccentKey(qIndex) {
  if (qIndex < 2) return "ember";
  if (qIndex < 4) return "gold";
  return "crimson";
}

/* Map question index → total progress % */
function progressPct(screenKey) {
  // screens: q0(name) → interstitial1 → q1..q4 → interstitial2 → forgeReady
  const MAP = {
    q0: 5, interstitial1: 22,
    q1: 35, q2: 50, q3: 65, q4: 80,
    interstitial2: 90, forgeReady: 100,
  };
  return MAP[screenKey] ?? 0;
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  useEmberParticles(canvasRef);

  // Inject styles once
  useEffect(() => {
    const id = "ob-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  /* ── State ── */
  const [screen, setScreen] = useState("q0"); // q0..q4, interstitial1, interstitial2, forgeReady
  const [answers, setAnswers] = useState({
    name: "",
    primaryDomain: "",
    commitmentLevel: "",
    motivationDriver: "",
    blockerHistory: "",
  });
  const [calibrateMsg, setCalibrateMsg] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Calibration cycling messages ── */
  useEffect(() => {
    if (screen !== "interstitial2") return;
    const msgs = INTERSTITIALS.forgeCalibrating.messages;
    let i = 0;
    setCalibrateMsg(msgs[0]);
    const iv = setInterval(() => {
      i++;
      if (i < msgs.length) setCalibrateMsg(msgs[i]);
      else {
        clearInterval(iv);
        setTimeout(() => setScreen("forgeReady"), 500);
      }
    }, 900);
    return () => clearInterval(iv);
  }, [screen]);

  /* ── Auto-advance interstitial1 ── */
  useEffect(() => {
    if (screen !== "interstitial1") return;
    const t = setTimeout(() => setScreen("q1"), 2800);
    return () => clearTimeout(t);
  }, [screen]);

  /* ── Helpers ── */
  const questionIndexOf = (s) => {
    const m = s.match(/^q(\d)$/);
    return m ? parseInt(m[1]) : -1;
  };

  const currentQIndex = questionIndexOf(screen);
  const currentQ = currentQIndex >= 0 ? QUESTIONS[currentQIndex] : null;
  const accentKey = currentQ ? getAccentKey(currentQIndex) : "ember";
  const accent = ACCENT[accentKey];

  const cssAccent = {
    "--accent":       accent.main,
    "--accent-light": accent.light,
    "--accent-dim":   accent.dim,
  };

  const currentAnswer =
    currentQ ? answers[currentQ.id] : "";

  const canProceed =
    currentQ?.type === "text"
      ? answers.name.trim().length > 0
      : !!currentAnswer;

  /* ── Navigation ── */
  function handleNext() {
    if (screen === "q0") { setScreen("interstitial1"); return; }
    if (screen === "q1") { setScreen("q2"); return; }
    if (screen === "q2") { setScreen("q3"); return; }
    if (screen === "q3") { setScreen("q4"); return; }
    if (screen === "q4") { setScreen("interstitial2"); return; }
  }

  function handleBack() {
    if (screen === "q0") return;
    if (screen === "q1") { setScreen("q0"); return; }
    if (screen === "q2") { setScreen("q1"); return; }
    if (screen === "q3") { setScreen("q2"); return; }
    if (screen === "q4") { setScreen("q3"); return; }
    if (screen === "forgeReady") { setScreen("q4"); return; }
  }

  /* ── Save & finish ── */
  async function handleBeginRise() {
    setSaving(true);
    try {
      await updateUser({
        name: answers.name.trim(),
        primaryDomain: answers.primaryDomain,
        commitmentLevel: answers.commitmentLevel,
        motivationDriver: answers.motivationDriver,
        blockerHistory: answers.blockerHistory,
        onboardingComplete: true,
        emberPoints: 0,
        level: 1,
        identityTier: "Ash",
      });
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Onboarding save error:", err);
      setSaving(false);
    }
  }

  /* ── Render helpers ── */
  function renderQuestion(q, qIndex) {
    const ak = getAccentKey(qIndex);
    const ac = ACCENT[ak];
    const cssVars = {
      "--accent":       ac.main,
      "--accent-light": ac.light,
      "--accent-dim":   ac.dim,
    };

    return (
      <>
        <div className="ob-header" style={cssVars}>
          <div className="ob-forge-label">⚔ FORGE REGISTRATION</div>
          <div className="ob-progress-track">
            <div
              className="ob-progress-fill"
              style={{ width: `${progressPct(`q${qIndex}`)}%`, "--accent": ac.main, "--accent-light": ac.light }}
            />
          </div>
          <div className="ob-progress-pct" style={{ "--accent": ac.main }}>
            {progressPct(`q${qIndex}`)}%
          </div>
        </div>

        <div className="ob-scan-text">{q.scan}</div>

        <div className="ob-content">
          <div className="ob-card ob-screen-enter" style={cssVars} key={`card-${q.id}`}>
            <div className="ob-q-label">{q.label}</div>
            <div className="ob-q-text">{q.question}</div>

            {q.type === "text" ? (
              <input
                className="ob-name-input"
                type="text"
                placeholder={q.placeholder}
                value={answers.name}
                maxLength={30}
                autoFocus
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, name: e.target.value }))
                }
                style={{ "--accent": ac.main, "--accent-dim": ac.dim }}
              />
            ) : (
              <div className="ob-options">
                {q.options.map((opt) => (
                  <div
                    key={opt}
                    className={`ob-option${answers[q.id] === opt ? " selected" : ""}`}
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [q.id]: opt }))
                    }
                    style={cssVars}
                  >
                    <div className="ob-radio-dot">
                      <div className="ob-radio-dot-inner" />
                    </div>
                    <span className="ob-option-text">{opt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ob-bottom-nav" style={cssVars}>
          {qIndex > 0 ? (
            <button className="ob-btn-back" onClick={handleBack}>
              BACK
            </button>
          ) : null}
          <button
            className="ob-btn-primary"
            disabled={!canProceed}
            onClick={handleNext}
          >
            ENTER THE FORGE →
          </button>
        </div>
      </>
    );
  }

  /* ─────────────────────────────────────────
     Screen: PHOENIX DETECTED
  ───────────────────────────────────────── */
  if (screen === "interstitial1") {
    return (
      <div className="ob-root">
        <canvas className="ob-particles" ref={canvasRef} />
        <div className="ob-interstitial">
          <div className="ob-interstitial-tag">// SYSTEM ALERT //</div>
          <div
            className="ob-silhouette"
            style={{ position: "relative" }}
          >
            <div className="ob-glow-ring" />
            <div className="ob-silhouette-head" />
            <div className="ob-silhouette-wing-l" />
            <div className="ob-silhouette-wing-r" />
            <div className="ob-silhouette-tail" />
          </div>
          <div className="ob-interstitial-title">PHOENIX DETECTED</div>
          <div className="ob-interstitial-subtitle">
            Your potential has been recognized
          </div>
          <div className="ob-load-track">
            <div className="ob-load-fill" />
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     Screen: FORGE CALIBRATING
  ───────────────────────────────────────── */
  if (screen === "interstitial2") {
    return (
      <div className="ob-root">
        <canvas className="ob-particles" ref={canvasRef} />
        <div className="ob-interstitial">
          <div className="ob-interstitial-tag">// CALIBRATION //</div>
          <div className="ob-interstitial-title">FORGE CALIBRATING</div>
          <div className="ob-interstitial-subtitle">
            Preparing your transformation matrix
          </div>
          <div className="ob-load-track">
            <div className="ob-load-fill" style={{ animationDuration: "3.6s" }} />
          </div>
          <div className="ob-calibrate-status">{calibrateMsg}</div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     Screen: FORGE READY
  ───────────────────────────────────────── */
  if (screen === "forgeReady") {
    return (
      <div className="ob-root">
        <canvas className="ob-particles" ref={canvasRef} />

        {/* Ambient radial glow */}
        <div
          style={{
            position: "fixed",
            top: "30%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 340, height: 340,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <div className="ob-header" style={{ "--accent": "#f97316", "--accent-light": "#fb923c" }}>
          <div className="ob-forge-label">⚔ FORGE REGISTRATION</div>
          <div className="ob-progress-track">
            <div className="ob-progress-fill" style={{ width: "100%", "--accent": "#f97316", "--accent-light": "#fb923c" }} />
          </div>
          <div className="ob-progress-pct" style={{ "--accent": "#f97316" }}>100%</div>
        </div>

        <div className="ob-ready-screen">
          <div className="ob-ready-tag">⚔ FORGE COMPLETE</div>
          <div className="ob-ready-title">FORGE READY</div>
          <div className="ob-ready-name">{answers.name || "Phoenix"}</div>

          <div className="ob-ready-stats">
            <div className="ob-stat-card">
              <div className="ob-stat-value">1</div>
              <div className="ob-stat-label">Level</div>
            </div>
            <div className="ob-stat-card">
              <div className="ob-stat-value">0</div>
              <div className="ob-stat-label">EP</div>
            </div>
            <div className="ob-stat-card">
              <div className="ob-stat-value">0</div>
              <div className="ob-stat-label">Streak</div>
            </div>
          </div>

          <div className="ob-ready-tier">
            Identity Tier · <span>Ash</span>
          </div>
        </div>

        <div
          className="ob-bottom-nav"
          style={{
            "--accent": "#f97316",
            "--accent-light": "#fb923c",
            "--accent-dim": "rgba(249,115,22,0.4)",
          }}
        >
          <button
            className="ob-btn-primary"
            style={{ fontSize: "15px" }}
            disabled={saving}
            onClick={handleBeginRise}
          >
            {saving ? "FORGING..." : "BEGIN YOUR RISE 🔥"}
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     Screens: Q0 – Q4
  ───────────────────────────────────────── */
  return (
    <div className="ob-root" style={cssAccent}>
      <canvas className="ob-particles" ref={canvasRef} />
      {currentQ && renderQuestion(currentQ, currentQIndex)}
    </div>
  );
}