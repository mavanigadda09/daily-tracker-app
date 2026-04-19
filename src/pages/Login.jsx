/**
 * Login.jsx — Production-grade auth page
 * ─────────────────────────────────────────────────────────────
 * UI/UX: Premium dark SaaS — volcanic obsidian + ember fire palette
 * Typography: DM Serif Display (display) + Syne (body)
 * All goals from the brief are addressed below.
 */

import { useState, useId } from "react";
import { auth, db, signInWithGoogle } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";

// ─── Firebase error → human message ──────────────────────────
const FIREBASE_ERRORS = {
  "auth/user-not-found"         : "No account found with this email.",
  "auth/wrong-password"         : "Incorrect password. Try again or reset it.",
  "auth/email-already-in-use"   : "This email is already registered. Sign in instead.",
  "auth/invalid-email"          : "That doesn't look like a valid email address.",
  "auth/weak-password"          : "Password must be at least 6 characters.",
  "auth/too-many-requests"      : "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed" : "Network error. Check your connection.",
  "auth/popup-closed-by-user"   : "Google sign-in was cancelled.",
  "auth/cancelled-popup-request": "Google sign-in was cancelled.",
  "auth/invalid-credential"     : "Incorrect email or password.",
};
function friendlyError(err) {
  return FIREBASE_ERRORS[err.code] ?? err.message ?? "Something went wrong. Please try again.";
}

// ─── Validation ───────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password, fullName, username, isRegister }) {
  if (!email)                return { field: "email",    msg: "Email is required." };
  if (!EMAIL_RE.test(email)) return { field: "email",    msg: "Enter a valid email address." };
  if (!password)             return { field: "password", msg: "Password is required." };
  if (password.length < 6)   return { field: "password", msg: "Password must be at least 6 characters." };
  if (isRegister) {
    if (!fullName.trim()) return { field: "fullName", msg: "Full name is required." };
    if (!username.trim()) return { field: "username",  msg: "Username is required." };
  }
  return null;
}

// ─── Password strength ────────────────────────────────────────
function passwordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#facc15", "#22c55e"];

// ─── Firestore helper ─────────────────────────────────────────
async function writeUserDoc(uid, payload, merge = false) {
  await setDoc(doc(db, "users", uid), payload, merge ? { merge: true } : undefined);
}

// ─── Icons ────────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function Spinner({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round"
      aria-hidden="true"
      style={{ animation: "lp-spin 0.7s linear infinite", flexShrink: 0 }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

// ─── Reusable FormField ───────────────────────────────────────
function FormField({ id, label, type = "text", value, onChange, onBlur, placeholder, autoComplete, error, rightSlot, disabled }) {
  return (
    <div className="lp-field">
      <label className="lp-label" htmlFor={id}>{label}</label>
      <div className={`lp-input-wrap${error ? " lp-input-wrap--error" : ""}`}>
        <input
          id={id}
          className="lp-input"
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        {rightSlot && <div className="lp-input-right">{rightSlot}</div>}
      </div>
      {error && (
        <p id={`${id}-err`} className="lp-field-error" role="alert">{error}</p>
      )}
    </div>
  );
}

// ─── Forgot Password Modal ────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const { showNotification } = useNotification();
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleReset = async () => {
    if (!EMAIL_RE.test(email)) { setError("Enter a valid email address."); return; }
    setLoading(true); setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      showNotification("Reset link sent 📬", "success");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="lp-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="lp-modal" role="dialog" aria-modal="true" aria-labelledby="fp-title">
        <button className="lp-modal-close" onClick={onClose} aria-label="Close dialog">✕</button>

        {sent ? (
          <div className="lp-modal-sent">
            <div className="lp-sent-icon" aria-hidden="true">📬</div>
            <h3 id="fp-title" className="lp-modal-title">Check your inbox</h3>
            <p className="lp-modal-body">
              A reset link was sent to <strong style={{ color: "#fff" }}>{email}</strong>.
              It may take a minute to arrive.
            </p>
            <button className="lp-primary-btn" style={{ marginTop: 8 }} onClick={onClose}>
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <h3 id="fp-title" className="lp-modal-title">Reset password</h3>
            <p className="lp-modal-body" style={{ margin: "6px 0 20px" }}>
              Enter your account email and we'll send you a reset link.
            </p>
            <div className="lp-field" style={{ marginBottom: 20 }}>
              <label className="lp-label" htmlFor="fp-email">Email address</label>
              <div className={`lp-input-wrap${error ? " lp-input-wrap--error" : ""}`}>
                <input
                  id="fp-email"
                  className="lp-input"
                  type="email"
                  value={email}
                  placeholder="you@domain.com"
                  autoComplete="email"
                  aria-invalid={!!error}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />
              </div>
              {error && <p className="lp-field-error" role="alert">{error}</p>}
            </div>
            <button
              className="lp-primary-btn"
              onClick={handleReset}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <Spinner size={18} color="#050810" /> : "Send reset link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function Login({ onLogin = () => {} }) {
  const navigate             = useNavigate();
  const { showNotification } = useNotification();
  const uid                  = useId();

  const [isRegister,    setIsRegister]    = useState(false);
  const [showForgot,    setShowForgot]    = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const [fieldErrors,  setFieldErrors]  = useState({});
  const [globalError,  setGlobalError]  = useState("");

  const pwStrength  = passwordStrength(password);
  const anyLoading  = loading || googleLoading;
  const clearErrors = () => { setFieldErrors({}); setGlobalError(""); };

  const switchMode = () => {
    setIsRegister((r) => !r);
    setEmail(""); setPassword(""); setFullName(""); setUsername("");
    setShowPw(false);
    clearErrors();
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate({ email, password, fullName, username, isRegister });
    if (err) { setFieldErrors({ [err.field]: err.msg }); return; }
    clearErrors();
    setLoading(true);
    try {
      let credential;
      if (isRegister) {
        credential = await createUserWithEmailAndPassword(auth, email, password);
        await writeUserDoc(credential.user.uid, { fullName: fullName.trim(), username: username.trim(), email });
        showNotification("Account created — welcome 🔥", "success");
      } else {
        credential = await signInWithEmailAndPassword(auth, email, password);
        showNotification("Welcome back 🚀", "success");
      }
      const { user } = credential;
      onLogin({ name: fullName || user.displayName || user.email.split("@")[0], email: user.email });
      navigate("/", { replace: true });
    } catch (err) {
      const msg = friendlyError(err);
      setGlobalError(msg);
      showNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Google ─────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true); clearErrors();
    try {
      const result = await signInWithGoogle();
      if (!result.success) throw new Error(result.error);
      const { user } = result;
      await writeUserDoc(user.uid, { fullName: user.displayName, email: user.email }, true);
      onLogin({ name: user.displayName, email: user.email });
      showNotification("Signed in with Google 🎉", "success");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = friendlyError(err);
      setGlobalError(msg);
      showNotification(msg, "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const setFieldErr = (field) => (msg) =>
    setFieldErrors((fe) => ({ ...fe, [field]: msg }));
  const clearField  = (field) => () =>
    setFieldErrors((fe) => ({ ...fe, [field]: "" }));

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="lp-root" role="main">
        <div className="lp-orb lp-orb-1" aria-hidden="true" />
        <div className="lp-orb lp-orb-2" aria-hidden="true" />
        <div className="lp-orb lp-orb-3" aria-hidden="true" />

        <div className="lp-card" role="region" aria-label="Authentication">

          {/* ── Left panel ── */}
          <aside className="lp-left" aria-hidden="true">
            <div className="lp-mesh" />
            <div className="lp-left-content">
              <div className="lp-flame-wrap">
                <div className="lp-flame-ring" />
                <img src="/phoenix.png" alt="" className="lp-logo" />
              </div>

              <h1 className="lp-brand">Phoenix<br/>Tracker</h1>
              <p className="lp-tagline">Rise. Track. Conquer.</p>
              <div className="lp-ember-line" />

              <ul className="lp-features">
                <li><span className="lp-feat-dot" />Daily movement &amp; step tracking</li>
                <li><span className="lp-feat-dot" />Habit streaks &amp; weight trends</li>
                <li><span className="lp-feat-dot" />AI focus coach &amp; deep work</li>
                <li><span className="lp-feat-dot" />Finance &amp; goals dashboard</li>
              </ul>

              <div className="lp-social-proof">
                <div className="lp-proof-avatars" aria-hidden="true">
                  {["🧑‍💻","👩‍🎨","👨‍🏋️","👩‍🔬"].map((e, i) => (
                    <span key={i} className="lp-avatar">{e}</span>
                  ))}
                </div>
                <p className="lp-proof-text">2,400+ people tracking today</p>
              </div>
            </div>
          </aside>

          {/* ── Right panel ── */}
          <main className="lp-right">
            <div className="lp-form-wrap">

              {/* Mode tabs */}
              <div className="lp-tabs" role="tablist" aria-label="Authentication mode">
                <button
                  className={`lp-tab${!isRegister ? " lp-tab--active" : ""}`}
                  role="tab" aria-selected={!isRegister}
                  onClick={() => isRegister && switchMode()}
                >Sign in</button>
                <button
                  className={`lp-tab${isRegister ? " lp-tab--active" : ""}`}
                  role="tab" aria-selected={isRegister}
                  onClick={() => !isRegister && switchMode()}
                >Create account</button>
              </div>

              <p className="lp-form-subtitle">
                {isRegister
                  ? "Start your rise — it only takes 30 seconds."
                  : "Your streak is waiting. Good to see you."}
              </p>

              {/* Global error */}
              {globalError && (
                <div className="lp-global-error" role="alert" aria-live="polite">
                  <span className="lp-error-icon" aria-hidden="true">⚠</span>
                  {globalError}
                </div>
              )}

              {/* Fields */}
              <div
                className="lp-fields"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              >
                {isRegister && (
                  <div className="lp-row">
                    <FormField
                      id={`${uid}-fullname`} label="Full name"
                      value={fullName} placeholder="Ada Lovelace"
                      autoComplete="name" error={fieldErrors.fullName}
                      disabled={anyLoading}
                      onChange={(e) => { setFullName(e.target.value); clearField("fullName")(); }}
                    />
                    <FormField
                      id={`${uid}-username`} label="Username"
                      value={username} placeholder="ada_rises"
                      autoComplete="username" error={fieldErrors.username}
                      disabled={anyLoading}
                      onChange={(e) => { setUsername(e.target.value); clearField("username")(); }}
                    />
                  </div>
                )}

                <FormField
                  id={`${uid}-email`} label="Email address"
                  type="email" value={email} placeholder="you@domain.com"
                  autoComplete="email" error={fieldErrors.email}
                  disabled={anyLoading}
                  onChange={(e) => { setEmail(e.target.value); clearField("email")(); }}
                  onBlur={() => {
                    if (email && !EMAIL_RE.test(email))
                      setFieldErr("email")("Enter a valid email address.");
                  }}
                  rightSlot={email && EMAIL_RE.test(email) ? <CheckIcon /> : null}
                />

                <FormField
                  id={`${uid}-password`} label="Password"
                  type={showPw ? "text" : "password"}
                  value={password} placeholder="Min. 6 characters"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  error={fieldErrors.password} disabled={anyLoading}
                  onChange={(e) => { setPassword(e.target.value); clearField("password")(); }}
                  rightSlot={
                    <button
                      type="button"
                      className="lp-pw-toggle"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showPw} />
                    </button>
                  }
                />

                {/* Password strength — register only */}
                {isRegister && password && (
                  <div
                    className="lp-strength"
                    aria-label={`Password strength: ${STRENGTH_LABEL[pwStrength]}`}
                    aria-live="polite"
                  >
                    <div className="lp-strength-bars">
                      {[1,2,3,4].map((n) => (
                        <div
                          key={n}
                          className="lp-strength-bar"
                          style={{
                            background: n <= pwStrength
                              ? STRENGTH_COLOR[pwStrength]
                              : "rgba(255,255,255,0.1)"
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="lp-strength-label"
                      style={{ color: STRENGTH_COLOR[pwStrength] }}
                    >
                      {STRENGTH_LABEL[pwStrength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Forgot password */}
              {!isRegister && (
                <div className="lp-forgot-wrap">
                  <button
                    type="button"
                    className="lp-forgot"
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Primary CTA */}
              <button
                className="lp-primary-btn"
                onClick={handleSubmit}
                disabled={anyLoading}
                aria-busy={loading}
              >
                {loading
                  ? <Spinner size={18} color="#050810" />
                  : isRegister ? "Create account" : "Sign in"}
              </button>

              <div className="lp-sep" role="separator">
                <span>or continue with</span>
              </div>

              {/* Google */}
              <button
                className="lp-google-btn"
                onClick={handleGoogle}
                disabled={anyLoading}
                aria-busy={googleLoading}
                aria-label="Sign in with Google"
              >
                {googleLoading ? <Spinner size={18} /> : <GoogleIcon />}
                <span>Google</span>
              </button>

              <p className="lp-terms">
                By continuing, you agree to our{" "}
                <a href="/terms" className="lp-link">Terms</a> and{" "}
                <a href="/privacy" className="lp-link">Privacy Policy</a>.
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.lp-root {
  --ember:   #f97316;
  --gold:    #facc15;
  --ink:     #040710;
  --surface: #080d1c;
  --panel:   #0b1120;
  --glass:   rgba(255,255,255,0.04);
  --border:  rgba(255,255,255,0.08);
  --muted:   rgba(255,255,255,0.35);
  --error:   #f87171;
  --success: #22c55e;

  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ink);
  font-family: 'Syne', sans-serif;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Ambient orbs */
.lp-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}
.lp-orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%);
  top: -200px; left: -150px;
  animation: lpOrb 14s ease-in-out infinite alternate;
}
.lp-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(250,204,21,0.10) 0%, transparent 70%);
  bottom: -150px; right: -100px;
  animation: lpOrb 18s ease-in-out infinite alternate-reverse;
}
.lp-orb-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%);
  top: 55%; left: 35%;
  animation: lpOrb 22s ease-in-out infinite alternate;
}
@keyframes lpOrb {
  from { transform: translate(0, 0); }
  to   { transform: translate(28px, 18px); }
}
@keyframes lp-spin { to { transform: rotate(360deg); } }

/* Card */
.lp-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 940px;
  display: flex;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(249,115,22,0.16);
  background: var(--panel);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.025),
    0 48px 140px rgba(0,0,0,0.85),
    0 0 80px rgba(249,115,22,0.06);
  animation: lpRise 0.65s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes lpRise {
  from { opacity:0; transform: translateY(32px) scale(0.97); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}

/* Left panel */
.lp-left {
  flex: 0 0 360px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(249,115,22,0.1);
}
.lp-mesh {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(160deg, rgba(249,115,22,0.18) 0%, rgba(250,204,21,0.07) 40%, transparent 70%),
    repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(249,115,22,0.035) 28px, rgba(249,115,22,0.035) 29px),
    repeating-linear-gradient(-45deg, transparent, transparent 28px, rgba(249,115,22,0.018) 28px, rgba(249,115,22,0.018) 29px);
  pointer-events: none;
}
.lp-left-content {
  position: relative;
  padding: 48px 38px;
  display: flex;
  flex-direction: column;
}
.lp-flame-wrap {
  position: relative;
  width: 72px; height: 72px;
  margin-bottom: 20px;
}
.lp-flame-ring {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 1.5px solid rgba(249,115,22,0.45);
  animation: lpRingPulse 3s ease-in-out infinite;
}
@keyframes lpRingPulse {
  0%,100% { opacity:0.4; transform:scale(1); }
  50%     { opacity:0.9; transform:scale(1.07); }
}
.lp-logo {
  width: 72px; height: 72px;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(249,115,22,0.55));
}
.lp-brand {
  font-family: 'DM Serif Display', serif;
  font-size: 2.55rem;
  line-height: 1.06;
  font-weight: 400;
  color: transparent;
  background: linear-gradient(140deg, #facc15 0%, #f97316 55%, #fb923c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  margin: 0 0 8px;
}
.lp-tagline {
  font-size: 11px;
  font-weight: 400;
  color: var(--muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 22px;
}
.lp-ember-line {
  width: 44px; height: 2px;
  background: linear-gradient(90deg, var(--ember), var(--gold));
  border-radius: 2px;
  margin-bottom: 22px;
}
.lp-features {
  list-style: none;
  padding: 0; margin: 0 0 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lp-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 400;
  color: rgba(255,255,255,0.5);
  line-height: 1.4;
}
.lp-feat-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ember), var(--gold));
  flex-shrink: 0;
}
.lp-social-proof { display:flex; align-items:center; gap:10px; }
.lp-proof-avatars { display:flex; }
.lp-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(249,115,22,0.14);
  border: 2px solid rgba(249,115,22,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  margin-right: -6px;
}
.lp-proof-text {
  margin: 0;
  font-size: 12px;
  color: rgba(255,255,255,0.28);
  padding-left: 14px;
}

/* Right panel */
.lp-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 44px;
}
.lp-form-wrap {
  width: 100%;
  max-width: 360px;
  animation: lpFormSlide 0.65s 0.08s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes lpFormSlide {
  from { opacity:0; transform:translateX(20px); }
  to   { opacity:1; transform:translateX(0); }
}

/* Tabs */
.lp-tabs {
  display: flex;
  background: rgba(255,255,255,0.035);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 20px;
  gap: 0;
}
.lp-tab {
  flex: 1;
  padding: 9px 12px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;
}
.lp-tab:hover:not(.lp-tab--active) { color: rgba(255,255,255,0.6); }
.lp-tab--active {
  background: linear-gradient(135deg, rgba(249,115,22,0.22), rgba(250,204,21,0.1));
  color: #fff;
  border: 1px solid rgba(249,115,22,0.22);
}
.lp-tab:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; }

.lp-form-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 20px;
  line-height: 1.5;
}

/* Global error */
.lp-global-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(248,113,113,0.07);
  border: 1px solid rgba(248,113,113,0.2);
  color: var(--error);
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 16px;
}
.lp-error-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }

/* Fields */
.lp-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 12px;
}
.lp-row { display:flex; gap:12px; }
.lp-row > .lp-field { flex:1; min-width:0; }
.lp-field { display:flex; flex-direction:column; gap:6px; }
.lp-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.lp-input-wrap { position:relative; display:flex; align-items:center; }
.lp-input-wrap--error .lp-input {
  border-color: rgba(248,113,113,0.45);
  background: rgba(248,113,113,0.04);
}
.lp-input {
  width: 100%;
  padding: 12px 42px 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--glass);
  color: #fff;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
@media (max-width: 680px) { .lp-input { font-size: 16px; } }
.lp-input::placeholder { color: rgba(255,255,255,0.17); }
.lp-input:focus {
  border-color: rgba(249,115,22,0.5);
  background: rgba(249,115,22,0.03);
  box-shadow: 0 0 0 3px rgba(249,115,22,0.11);
}
.lp-input:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; }
.lp-input:disabled { opacity:0.45; cursor:not-allowed; }

.lp-input-right {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  color: var(--muted);
  pointer-events: none;
}
.lp-input-right > button { pointer-events: auto; }
.lp-pw-toggle {
  background: none; border: none; padding: 4px;
  cursor: pointer; color: var(--muted);
  display: flex; align-items: center;
  border-radius: 6px;
  transition: color 0.2s;
}
.lp-pw-toggle:hover { color: rgba(255,255,255,0.75); }
.lp-pw-toggle:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; }

.lp-field-error {
  font-size: 12px;
  color: var(--error);
  margin: 0;
}

/* Strength meter */
.lp-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: -4px;
}
.lp-strength-bars { display:flex; gap:4px; flex:1; }
.lp-strength-bar {
  height: 4px; flex:1; border-radius:4px;
  transition: background 0.3s;
}
.lp-strength-label {
  font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
  min-width: 40px; text-align: right;
  transition: color 0.3s;
}

/* Forgot */
.lp-forgot-wrap {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
.lp-forgot {
  background: none; border: none; padding: 0;
  font-family: 'Syne', sans-serif;
  font-size: 12px; color: var(--ember);
  cursor: pointer; opacity: 0.65;
  transition: opacity 0.2s;
}
.lp-forgot:hover { opacity: 1; }
.lp-forgot:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; border-radius: 3px; }

/* Primary button */
.lp-primary-btn {
  width: 100%; padding: 14px;
  border-radius: 10px; border: none;
  background: linear-gradient(135deg, #f97316, #facc15);
  color: #050810;
  font-family: 'Syne', sans-serif;
  font-size: 14px; font-weight: 600; letter-spacing: 0.03em;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 24px rgba(249,115,22,0.26);
}
.lp-primary-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(249,115,22,0.36);
}
.lp-primary-btn:active:not(:disabled) { transform: translateY(0); }
.lp-primary-btn:disabled { opacity: 0.48; cursor: not-allowed; box-shadow: none; }
.lp-primary-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

/* Separator */
.lp-sep {
  display: flex; align-items: center; gap: 10px;
  margin: 18px 0;
  color: rgba(255,255,255,0.2);
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
}
.lp-sep::before, .lp-sep::after {
  content: ''; flex: 1; height: 1px; background: var(--border);
}

/* Google button */
.lp-google-btn {
  width: 100%; padding: 13px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--glass);
  color: rgba(255,255,255,0.75);
  font-family: 'Syne', sans-serif;
  font-size: 14px; font-weight: 500;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  min-height: 48px;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  margin-bottom: 20px;
}
.lp-google-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.07);
  border-color: rgba(255,255,255,0.16);
  color: #fff;
}
.lp-google-btn:disabled { opacity:0.48; cursor:not-allowed; }
.lp-google-btn:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; }

/* Terms */
.lp-terms {
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  text-align: center;
  margin: 0; line-height: 1.6;
}
.lp-link { color: rgba(249,115,22,0.6); text-decoration: none; transition: color 0.2s; }
.lp-link:hover { color: var(--ember); }

/* Modal */
.lp-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(4,7,16,0.85);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
  animation: lpFadeIn 0.2s ease both;
}
@keyframes lpFadeIn { from { opacity:0; } to { opacity:1; } }
.lp-modal {
  background: #0f1629;
  border: 1px solid rgba(249,115,22,0.18);
  border-radius: 20px;
  padding: 36px;
  width: 100%; max-width: 400px;
  position: relative;
  box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(249,115,22,0.06);
  animation: lpModalRise 0.3s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes lpModalRise {
  from { opacity:0; transform:translateY(20px) scale(0.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.lp-modal-close {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none;
  color: var(--muted); font-size: 15px; cursor: pointer;
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, color 0.2s;
}
.lp-modal-close:hover { background: rgba(255,255,255,0.06); color: #fff; }
.lp-modal-close:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; }
.lp-modal-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.5rem; font-weight: 400;
  color: #fff; margin: 0 0 6px;
}
.lp-modal-body {
  font-size: 13px; color: var(--muted);
  line-height: 1.6; margin: 0;
}
.lp-modal-sent {
  display: flex; flex-direction: column;
  align-items: center; text-align: center; gap: 10px;
}
.lp-sent-icon { font-size: 42px; }

/* Responsive */
@media (max-width: 700px) {
  .lp-left { display: none; }
  .lp-card { border-radius: 20px; }
  .lp-right { padding: 32px 24px; }
  .lp-row { flex-direction: column; gap: 16px; }
  .lp-form-wrap { max-width: 100%; }
}
@media (max-width: 400px) {
  .lp-right { padding: 28px 18px; }
  .lp-card { border-radius: 16px; }
}
`;
