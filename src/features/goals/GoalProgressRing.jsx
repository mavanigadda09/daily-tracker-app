/**
 * A real SVG arc progress ring.
 * The original was a CSS circle that looked the same at 5% and 95%.
 *
 * Props:
 *   percent  — 0–100
 *   size     — diameter in px (default 120)
 *   stroke   — ring thickness (default 10)
 *   isGain   — true for weight-gain goals (changes color semantics)
 */
export function GoalProgressRing({
  percent = 0,
  size = 120,
  stroke = 10,
  isGain = false,
}) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(Math.max(percent, 0), 100) / 100) * circumference;
  const gap = circumference - filled;

  // Gain goals: use info color (blue) instead of success (green)
  const trackColor = "var(--color-border-tertiary)";
  const fillColor = isGain
    ? "var(--color-text-info)"
    : "var(--color-text-success)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", margin: "10px auto" }}
      aria-label={`Progress: ${percent}%`}
      role="img"
    >
      {/* Track */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />
      {/* Progress arc — starts at 12 o'clock via -90deg rotation */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={fillColor}
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${gap}`}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray 0.4s ease" }}
      />
      {/* Center label */}
      <text
        x={cx} y={cx}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.17}
        fontWeight="600"
        fill="var(--color-text-primary)"
      >
        {percent}%
      </text>
    </svg>
  );
}