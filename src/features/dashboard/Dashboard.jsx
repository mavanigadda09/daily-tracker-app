/**
 * Dashboard.jsx — UI Layer
 * ─────────────────────────────────────────────────────────────
 * Purely presentational. All logic lives in useDashboardIntelligence.
 */

import React, { useEffect, useRef } from "react";
import { useNotification } from "../../context/NotificationContext";
import { useDashboardIntelligence } from "../../hooks/useDashboardIntelligence";

const SEVERITY_COLOR = {
  critical : "var(--accent-red,   #ef4444)",
  warning  : "var(--accent-orange,#f97316)",
  info     : "var(--accent,       #6366f1)",
};

const STATUS_COLOR = {
  good: "var(--accent,        #6366f1)",
  warn: "var(--accent-orange, #f97316)",
  bad:  "var(--accent-red,    #ef4444)",
};

const CATEGORY_ICON = {
  task    : "◈",
  habit   : "◉",
  movement: "◎",
  log     : "◫",
};

function ProgressRing({ percent, size = 120, stroke = 8, color = "var(--accent)" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

function Sparkline({ points }) {
  if (!points) return (
    <p style={s.hint}>Log weight twice to see trend</p>
  );

  const ptStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg width={180} height={40} style={{ marginTop: 12, overflow: "visible" }}>
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-orange,#f97316)" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="url(#spk)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" points={ptStr} />
      {points.at(-1) && (
        <circle cx={points.at(-1).x} cy={points.at(-1).y} r="4"
          fill="var(--accent-orange,#f97316)" />
      )}
    </svg>
  );
}

function IssueBadge({ issue }) {
  const color = SEVERITY_COLOR[issue.severity];
  return (
    <div style={{ ...s.issueBadge, borderColor: color }}>
      <span style={{ ...s.issueDot, background: color }} />
      <div>
        <p style={{ ...s.issueLabel, color }}>{issue.label}</p>
        <p style={s.issueDetail}>{issue.detail}</p>
      </div>
    </div>
  );
}

function FocusCard({ focus }) {
  const icon = CATEGORY_ICON[focus.category] ?? "◆";
  const isHigh = focus.priority === "high";

  return (
    <div style={{ ...s.focusCard, borderColor: isHigh ? "var(--accent-orange,#f97316)" : "var(--accent)" }}>
      <div style={s.focusHeader}>
        <span style={s.focusIcon}>{icon}</span>
        <span style={s.focusPill}>{focus.priority} priority</span>
      </div>
      <p style={s.focusTitle}>{focus.title}</p>
      <p style={s.focusDesc}>{focus.description}</p>
    </div>
  );
}

function MetricCard({ metric }) {
  const color = STATUS_COLOR[metric.status] ?? "var(--text)";

  return (
    <div style={s.metricCard} className="glass-panel">
      <p style={s.metricLabel}>{metric.label}</p>
      <div style={s.metricValueRow}>
        {metric.progress !== undefined
          ? (
            <div style={{ position: "relative", width: 72, height: 72 }}>
              <ProgressRing percent={metric.progress} size={72} stroke={6} color={color} />
              <span style={{ ...s.metricRingValue, color }}>
                {Math.round(metric.progress)}%
              </span>
            </div>
          )
          : (
            <p style={{ ...s.metricBigValue, color }}>
              {metric.value}
              {metric.unit && <small style={s.metricUnit}>{metric.unit}</small>}
              {metric.trend === "up"   && <span style={s.trend}>↑</span>}
              {metric.trend === "down" && <span style={{ ...s.trend, color: "var(--accent)" }}>↓</span>}
            </p>
          )
        }
      </div>
      {metric.actionHint && (
        <p style={s.metricHint}>{metric.actionHint}</p>
      )}
    </div>
  );
}

export default function Dashboard({ user, tasks = [], items = [], weightLogs = [] }) {
  const { showNotification } = useNotification();
  const welcomeShown = useRef(false);

  const { issues, focus, metrics, sparklinePoints } = useDashboardIntelligence({
    tasks,
    items,
    weightLogs,
  });

  const weightMetric = metrics.find((m) => m.key === "weight");

  // Derive the first name with the same trim guard used everywhere else
  const firstName = user?.name?.trim()?.split(" ")[0]
    || user?.displayName?.trim()?.split(" ")[0]
    || null;

  useEffect(() => {
    if (firstName && !welcomeShown.current) {
      showNotification(`Welcome back, ${firstName} 🔥`, "success");
      welcomeShown.current = true;
    }
  }, [firstName, showNotification]);

  const notifiedIssues = useRef(new Set());
  useEffect(() => {
    issues
      .filter((i) => i.severity === "critical" && !notifiedIssues.current.has(i.type))
      .forEach((i) => {
        showNotification(i.label, "error");
        notifiedIssues.current.add(i.type);
      });
  }, [issues, showNotification]);

  return (
    <div style={s.page}>
      <div className="phoenix-watermark" />

      <div style={s.inner}>
        <header style={s.header}>
          <h1 style={s.greeting}>
            Rise,{" "}
            <span className="text-phoenix-gradient">
              {firstName ?? "Phoenix"}
            </span>
          </h1>
          <p style={s.subtitle}>Your daily vitals, prioritised.</p>
        </header>

        {issues.length > 0 && (
          <section style={s.issueStrip} aria-label="Active issues">
            {issues.map((issue) => (
              <IssueBadge key={issue.type} issue={issue} />
            ))}
          </section>
        )}

        <section style={s.section}>
          <SectionLabel>Daily Focus</SectionLabel>
          <FocusCard focus={focus} />
        </section>

        <section style={s.section}>
          <SectionLabel>Vitals</SectionLabel>
          <div style={s.metricsGrid} className="bento-grid-mobile">
            {metrics.map((m) => (
              <MetricCard key={m.key} metric={m} />
            ))}
          </div>
        </section>

        <section style={s.section}>
          <SectionLabel>Weight Trend</SectionLabel>
          <div style={s.trendCard} className="glass-panel">
            <div style={s.trendTop}>
              <div>
                <p style={s.metricLabel}>Latest</p>
                <p style={{ ...s.metricBigValue, color: STATUS_COLOR[weightMetric?.status ?? "good"] }}>
                  {weightMetric?.value ?? "—"}
                  <small style={s.metricUnit}> kg</small>
                </p>
              </div>
              {weightMetric?.actionHint && (
                <span style={s.trendHint}>{weightMetric.actionHint}</span>
              )}
            </div>
            <Sparkline points={sparklinePoints} />
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <p style={s.sectionLabel}>{children}</p>;
}

const s = {
  page      : { position: "relative", minHeight: "100vh", color: "var(--text)", overflowX: "hidden", padding: "20px" },
  inner     : { position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto" },
  header    : { marginBottom: "28px" },
  greeting  : { fontSize: "clamp(1.8rem,5vw,2.8rem)", fontWeight: 800, margin: 0, lineHeight: 1.1 },
  subtitle  : { color: "var(--text-muted)", marginTop: "6px", fontSize: "13px", letterSpacing: "0.04em" },
  issueStrip  : { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" },
  issueBadge  : { display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)", borderRadius: "8px",
                  border: "1px solid transparent", borderLeft: "3px solid" },
  issueDot    : { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "4px" },
  issueLabel  : { margin: 0, fontSize: "13px", fontWeight: 600 },
  issueDetail : { margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)" },
  focusCard   : { padding: "20px 22px", background: "rgba(255,255,255,0.04)",
                  borderRadius: "12px", border: "1px solid", borderLeft: "4px solid" },
  focusHeader : { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
  focusIcon   : { fontSize: "18px", lineHeight: 1 },
  focusPill   : { fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px",
                  color: "var(--text-muted)", padding: "2px 8px",
                  background: "rgba(255,255,255,0.06)", borderRadius: "100px" },
  focusTitle  : { margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 700 },
  focusDesc   : { margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 },
  section      : { marginBottom: "28px" },
  sectionLabel : { fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px",
                   color: "var(--text-muted)", marginBottom: "10px", margin: "0 0 10px" },
  metricsGrid  : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" },
  metricCard   : { padding: "18px 16px", display: "flex", flexDirection: "column", gap: "8px", borderRadius: "12px" },
  metricLabel  : { margin: 0, fontSize: "11px", textTransform: "uppercase",
                   letterSpacing: "1.2px", color: "var(--text-muted)" },
  metricValueRow   : { display: "flex", alignItems: "center" },
  metricBigValue   : { margin: 0, fontSize: "2rem", fontWeight: 800, lineHeight: 1 },
  metricRingValue  : { position: "absolute", inset: 0, display: "flex",
                       alignItems: "center", justifyContent: "center",
                       fontSize: "12px", fontWeight: 700 },
  metricUnit   : { fontSize: "12px", color: "var(--text-muted)", fontWeight: 400, marginLeft: "3px" },
  metricHint   : { margin: 0, fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" },
  trend        : { fontSize: "1rem", marginLeft: "4px", color: "var(--accent-red,#ef4444)" },
  trendCard  : { padding: "20px 24px", borderRadius: "12px" },
  trendTop   : { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  trendHint  : { fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic",
                 maxWidth: "160px", textAlign: "right" },
  hint       : { fontSize: "11px", color: "var(--accent-orange,#f97316)", fontStyle: "italic", marginTop: "10px" },
};