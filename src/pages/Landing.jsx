import { useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────
// Separated from markup — reorder, add, or A/B test without touching JSX

const FEATURES = [
  { icon: "🤖", text: "AI Coach & smart suggestions" },
  { icon: "📊", text: "Insights & analytics" },
  { icon: "🔥", text: "Habit & streak tracking" },
  { icon: "💰", text: "Finance tracking" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Landing({ onStart }) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onStart?.();
    } finally {
      // If navigation happens, this component unmounts and finally is a no-op.
      // If onStart fails or returns without navigating, re-enable the button.
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.card} role="main">

        <h1 style={s.title}>Your personal life OS</h1>

        <p style={s.subtitle}>
          Track habits, manage tasks, analyze performance,
          and get AI-powered insights — all in one place.
        </p>

        <ul style={s.features} aria-label="Key features">
          {FEATURES.map(({ icon, text }) => (
            <li key={text} style={s.feature}>
              <span style={s.featureIcon} aria-hidden="true">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <button
          style={{
            ...s.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={handleStart}
          disabled={loading}
          aria-label="Get started with Phoenix Tracker"
          // autoFocus gives keyboard users a direct path without tabbing
          autoFocus
        >
          {loading ? "Starting…" : "Get started →"}
        </button>

      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = {
  container: {
    // min-height + dvh: fixes iOS Safari toolbar overflow
    // 100vh fallback for browsers that don't support dvh yet
    minHeight: "100vh",
    // eslint-disable-next-line no-dupe-keys
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    // CSS variables — theme system applies correctly in both modes
    background: "var(--color-background-tertiary)",
    padding: 20,
  },

  card: {
    textAlign: "center",
    padding: 40,
    borderRadius: 20,
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    maxWidth: 480,
    width: "100%",
  },

  title: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 12,
    color: "var(--color-text-primary)",
    lineHeight: 1.2,
  },

  subtitle: {
    color: "var(--color-text-secondary)",
    marginBottom: 28,
    lineHeight: 1.6,
    fontSize: 15,
  },

  features: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 32px 0",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  feature: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "var(--color-text-secondary)",
  },

  featureIcon: {
    fontSize: 16,
    // Explicit size prevents icon inheriting container font-size
    lineHeight: 1,
  },

  button: {
    padding: "12px 28px",
    borderRadius: 10,
    border: "none",
    background: "var(--color-background-info)",
    color: "var(--color-text-info)",
    fontWeight: 600,
    fontSize: 15,
    transition: "opacity 0.15s",
    width: "100%",
  },
};