import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useHaptics } from "../hooks/useHaptics";

/* ================== STYLES ================== */
const STYLES = `
*{box-sizing:border-box;margin:0;padding:0}

:root{
  --fire:#f97316;
  --coal:#facc15;
  --blood:#ef4444;
  --void:#02040a;
  --void-card:#0a1020;
  --ash:#94a3b8;
  --snow:#f1f5f9;
  --T:'Cinzel','Georgia',serif;
  --U:'Rajdhani','Arial Narrow',sans-serif;
}

.forge{
  min-height:100dvh;
  background:var(--void);
  color:var(--snow);
  font-family:var(--U);
  display:flex;flex-direction:column;
  overflow:hidden;
  padding: 24px 20px;
  gap: 20px;
}

.forge-title{
  font-family: var(--T);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--snow);
  letter-spacing: 0.05em;
}

.forge-subtitle{
  font-size: 0.9rem;
  color: var(--ash);
  margin-top: 4px;
}

.forge-ep-bar{
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--ash);
}

.forge-ep-track{
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  overflow: hidden;
}

.forge-ep-fill{
  height: 100%;
  border-radius: 4px;
  background: var(--accent, #f97316);
  transition: width 0.4s ease;
}

.tap-impact{
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  cursor: pointer;
}
.tap-impact:active{
  transform: scale(0.96);
}

.forge-card{
  animation: cardEnter 0.35s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

@keyframes cardEnter{
  from{opacity:0;transform:translateY(20px) scale(0.96)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

.forge-question{
  font-family: var(--T);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--snow);
  line-height: 1.3;
  margin-bottom: 8px;
}

.forge-input{
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  color: var(--snow);
  font-family: var(--U);
  font-size: 1.1rem;
  outline: none;
  transition: border-color 0.2s;
}
.forge-input:focus{
  border-color: var(--accent, #f97316);
}

.forge-opt{
  padding: 14px 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--ash);
  cursor: pointer;
  transition: all 0.18s ease;
}
.forge-opt:hover{
  background: rgba(255,255,255,0.08);
  color: var(--snow);
}
.forge-opt.on{
  background: rgba(249,115,22,0.15);
  border-color: var(--accent, #f97316);
  color: var(--snow);
  font-weight: 600;
  animation: pulseSelect 0.25s ease;
}
@keyframes pulseSelect{
  0%{transform:scale(0.98)}
  60%{transform:scale(1.03)}
  100%{transform:scale(1)}
}

.forge-actions{
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
}

.forge-btn{
  flex: 1;
  padding: 15px;
  border-radius: 12px;
  border: none;
  font-family: var(--U);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.12s;
}
.forge-btn:active{ transform: scale(0.97); }
.forge-btn:disabled{ opacity: 0.35; cursor: not-allowed; }

.forge-btn-primary{
  background: var(--accent, #f97316);
  color: #fff;
}
.forge-btn-back{
  flex: 0 0 80px;
  background: rgba(255,255,255,0.07);
  color: var(--ash);
}

/* Ready screen */
.forge-ready{
  min-height: 100dvh;
  background: var(--void);
  color: var(--snow);
  font-family: var(--U);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  gap: 16px;
  text-align: center;
}

.forge-ready-icon{
  font-size: 3rem;
  margin-bottom: 8px;
}

.forge-ready-title{
  font-family: var(--T);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--snow);
}

.forge-ready-name{
  font-family: var(--T);
  font-size: 1.4rem;
  color: #f97316;
}

.forge-ready-stats{
  display: flex;
  gap: 24px;
  margin: 8px 0 24px;
}

.forge-ready-stat{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.forge-ready-stat-val{
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--snow);
}

.forge-ready-stat-label{
  font-size: 0.75rem;
  color: var(--ash);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.forge-ready-btn{
  width: 100%;
  max-width: 320px;
  padding: 16px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #f97316, #facc15);
  color: #02040a;
  font-family: var(--U);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.12s;
}
.forge-ready-btn:active{ transform: scale(0.97); }
.forge-ready-btn:disabled{ opacity: 0.45; cursor: not-allowed; }
`;

/* ================== CONFIG ================== */
const QS = [
  { id: "name",            q: "What shall the Forge call you?",    type: "text" },
  { id: "primaryDomain",   q: "What is your primary transformation?", type: "radio", opts: ["Body","Mind","Discipline","All Domains"] },
  { id: "commitmentLevel", q: "How committed are you?",            type: "radio", opts: ["Exploring","Building Habits","Serious","LEGENDARY"] },
  { id: "motivationDriver",q: "What drives you?",                  type: "radio", opts: ["EP rewards","Identity evolution","Daily streaks","Missions"] },
  { id: "blockerHistory",  q: "What held you back?",               type: "radio", opts: ["Consistency","Motivation","Time","No system"] },
];

const CTA_LABELS = [
  "Speak Your Name",
  "Choose Your Path",
  "Declare Commitment",
  "Define Your Drive",
  "Reveal Your Weakness",
];

/* ================== COMPONENT ================== */
export default function Onboarding() {
  const { updateUser } = useAuth();
  const navigate       = useNavigate();
  const { tap, medium, heavy } = useHaptics();

  const [qi,      setQi]      = useState(0);
  const [ans,     setAns]     = useState({});
  const [ep,      setEp]      = useState(0);
  const [level,   setLevel]   = useState(1);
  const [ready,   setReady]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  /* Inject styles once */
  useEffect(() => {
    if (!document.getElementById("forge-css")) {
      const el = document.createElement("style");
      el.id = "forge-css";
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  /* Accent color */
  const accentColor =
    ans.commitmentLevel === "LEGENDARY" ? "#ef4444" :
    ans.primaryDomain   === "Discipline" ? "#facc15" :
    "#f97316";

  /* EP gain */
  const gainEP = (amt = 10) => {
    setEp(prev => {
      const next = prev + amt;
      if (next >= level * 50) {
        setLevel(l => l + 1);
        heavy();
      } else {
        tap();
      }
      return next;
    });
  };

  const Q      = QS[qi];
  const canGo  = Q?.type === "text"
    ? ans.name?.trim()?.length > 0
    : !!ans[Q?.id];

  const epPct  = Math.min((ep / (level * 50)) * 100, 100);

  /* Next question */
  const handleNext = () => {
    medium();
    gainEP(15);
    if (qi < QS.length - 1) {
      setQi(qi + 1);
    } else {
      setReady(true);
    }
  };

  /* Back */
  const handleBack = () => {
    if (qi > 0) setQi(qi - 1);
  };

  /* Select radio option */
  const handleSelect = (opt) => {
    medium();
    gainEP(12);
    setAns(a => ({ ...a, [Q.id]: opt }));
  };

  /* Final submit */
  const beginRise = async () => {
    heavy();
    setSaving(true);
    setError("");
    try {
      await updateUser({
        ...ans,
        emberPoints:       ep,
        level,
        identityTier:      "Ash",
        onboardingComplete: true,
      });
      // replace:true so back button never returns to onboarding
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Onboarding save failed:", err);
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  /* ── Ready screen ── */
  if (ready) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="forge-ready">
          <div className="forge-ready-icon">🔥</div>
          <div className="forge-ready-title">FORGE READY</div>
          <div className="forge-ready-name">{ans.name}</div>

          <div className="forge-ready-stats">
            <div className="forge-ready-stat">
              <span className="forge-ready-stat-val">{level}</span>
              <span className="forge-ready-stat-label">Level</span>
            </div>
            <div className="forge-ready-stat">
              <span className="forge-ready-stat-val">{ep}</span>
              <span className="forge-ready-stat-label">EP</span>
            </div>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</p>
          )}

          <button
            className="forge-ready-btn tap-impact"
            onClick={beginRise}
            disabled={saving}
          >
            {saving ? "Forging your path…" : "Begin Your Rise 🔥"}
          </button>
        </div>
      </>
    );
  }

  /* ── Question screen ── */
  return (
    <>
      <style>{STYLES}</style>
      <div className="forge" style={{ "--accent": accentColor }}>

        {/* Header */}
        <div>
          <div className="forge-title">Phoenix Forge</div>
          <div className="forge-subtitle">
            Step {qi + 1} of {QS.length}
          </div>
        </div>

        {/* EP bar */}
        <div className="forge-ep-bar">
          <span>Lv {level}</span>
          <div className="forge-ep-track">
            <div className="forge-ep-fill" style={{ width: `${epPct}%` }} />
          </div>
          <span>{ep} EP</span>
        </div>

        {/* Question card */}
        <div className="forge-card" key={qi}>
          <div className="forge-question">{Q?.q}</div>

          {Q?.type === "text" ? (
            <input
              className="forge-input"
              autoFocus
              placeholder="Speak your name…"
              value={ans.name || ""}
              onChange={e => {
                tap();
                setAns(a => ({ ...a, name: e.target.value }));
              }}
              onKeyDown={e => e.key === "Enter" && canGo && handleNext()}
            />
          ) : (
            Q?.opts.map(opt => (
              <div
                key={opt}
                className={`forge-opt tap-impact ${ans[Q.id] === opt ? "on" : ""}`}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="forge-actions">
          {qi > 0 && (
            <button className="forge-btn forge-btn-back tap-impact" onClick={handleBack}>
              Back
            </button>
          )}
          <button
            className="forge-btn forge-btn-primary tap-impact"
            disabled={!canGo}
            onClick={handleNext}
          >
            {CTA_LABELS[qi]}
          </button>
        </div>

      </div>
    </>
  );
}