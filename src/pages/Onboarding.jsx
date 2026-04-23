// :contentReference[oaicite:0]{index=0}
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useHaptics } from "../hooks/useHaptics";

/* ================== STYLES (UPDATED) ================== */
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
}

/* Tap feedback */
.tap-impact{
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.tap-impact:active{
  transform: scale(0.96);
  box-shadow: 0 0 12px var(--accent);
}

/* Card animation */
.forge-card{
  animation: cardEnter 0.35s ease;
}
@keyframes cardEnter{
  from{opacity:0;transform:translateY(20px) scale(0.96)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

/* Selection pulse */
.forge-opt.on{
  animation: pulseSelect 0.25s ease;
}
@keyframes pulseSelect{
  0%{transform:scale(0.98)}
  60%{transform:scale(1.03)}
  100%{transform:scale(1)}
}
`;

/* ================== CONFIG ================== */

const QS = [
  { id:"name", q:"What shall the Forge call you?", type:"text" },
  { id:"primaryDomain", q:"What is your primary transformation?", type:"radio", opts:["Body","Mind","Discipline","All Domains"] },
  { id:"commitmentLevel", q:"How committed are you?", type:"radio", opts:["Exploring","Building Habits","Serious","LEGENDARY"] },
  { id:"motivationDriver", q:"What drives you?", type:"radio", opts:["EP rewards","Identity evolution","Daily streaks","Missions"] },
  { id:"blockerHistory", q:"What held you back?", type:"radio", opts:["Consistency","Motivation","Time","No system"] },
];

const AK = {
  fire:{ main:"#f97316" },
  coal:{ main:"#facc15" },
  blood:{ main:"#ef4444" },
};

const CTA_LABELS = {
  q0: "Speak Your Name",
  q1: "Choose Your Path",
  q2: "Declare Commitment",
  q3: "Define Your Drive",
  q4: "Reveal Your Weakness",
};

/* ================== COMPONENT ================== */

export default function Onboarding() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { tap, medium, heavy } = useHaptics();

  const [screen, setScreen] = useState("q0");
  const [ans, setAns] = useState({});
  const [ep, setEp] = useState(0);
  const [level, setLevel] = useState(1);
  const [saving, setSaving] = useState(false);

  /* Inject styles */
  useEffect(() => {
    if (!document.getElementById("forge-css")) {
      const el = document.createElement("style");
      el.id = "forge-css";
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  /* Dynamic Accent */
  const getAccent = () => {
    if (ans.commitmentLevel === "LEGENDARY") return AK.blood;
    if (ans.primaryDomain === "Discipline") return AK.coal;
    return AK.fire;
  };

  const ac = getAccent();

  /* EP System */
  const gainEP = (amt=10) => {
    setEp(prev=>{
      const next = prev + amt;
      if (next >= level * 50) {
        setLevel(l=>l+1);
        heavy();
      } else tap();
      return next;
    });
  };

  const qi = parseInt(screen.replace("q",""));
  const Q = QS[qi];

  const canGo = Q?.type==="text"
    ? ans.name?.trim()?.length>0
    : !!ans[Q?.id];

  const next = () => {
    medium();
    gainEP(15);

    if (qi < QS.length - 1) {
      setScreen("q"+(qi+1));
    } else {
      setScreen("ready");
    }
  };

  const back = () => {
    if (qi > 0) setScreen("q"+(qi-1));
  };

  async function beginRise(){
    heavy();
    setSaving(true);

    await updateUser({
      ...ans,
      emberPoints: ep,
      level,
      identityTier: "Ash",
      onboardingComplete:true,
    });

    navigate("/home");
  }

  /* ================== UI ================== */

  if (screen === "ready") {
    return (
      <div className="forge">
        <h1>🔥 FORGE READY</h1>
        <h2>{ans.name}</h2>

        <div>
          <p>Level: {level}</p>
          <p>EP: {ep}</p>
        </div>

        <button className="tap-impact" onClick={beginRise}>
          Begin Your Rise 🔥
        </button>
      </div>
    );
  }

  return (
    <div className="forge" style={{ "--accent": ac.main }}>
      <div className="forge-card">

        <h2>{Q?.q}</h2>

        {Q?.type==="text" ? (
          <input
            autoFocus
            value={ans.name||""}
            onChange={e=>{
              tap();
              setAns(a=>({...a,name:e.target.value}));
            }}
          />
        ) : (
          Q?.opts.map(opt=>(
            <div
              key={opt}
              className={`forge-opt tap-impact ${ans[Q.id]===opt?"on":""}`}
              onClick={()=>{
                medium();
                gainEP(12);
                setAns(a=>({...a,[Q.id]:opt}));
              }}
            >
              {opt}
            </div>
          ))
        )}

      </div>

      <div>
        {qi>0 && <button onClick={back}>Back</button>}

        <button
          className="tap-impact"
          disabled={!canGo}
          onClick={next}
        >
          {CTA_LABELS[screen]}
        </button>
      </div>
    </div>
  );
}