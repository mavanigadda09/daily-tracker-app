export const theme = {
  /* ================= COLORS ================= */
  colors: {
    primary: "var(--accent)",

    bg: "var(--bg)",
    surface: "var(--card)",
    surfaceHover: "var(--card-hover)",

    text: "var(--text)",
    textMuted: "var(--text-muted)",

    border: "var(--border)",

    /* 🔥 STATUS COLORS */
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",

    /* 🔥 CHART COLORS */
    chartPrimary: "var(--accent)",
    chartSecondary: "#22c55e",
    chartGrid: "var(--border)"
  },

  /* ================= RADIUS ================= */
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px"
  },

  /* ================= SPACING ================= */
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px"
  },

  /* ================= TYPOGRAPHY ================= */
  typography: {
    sm: "13px",
    md: "15px",
    lg: "18px",
    xl: "24px",
    xxl: "32px"
  },

  /* ================= SHADOW ================= */
  shadow: {
    sm: "0 2px 6px rgba(0,0,0,0.2)",
    md: "0 8px 25px rgba(0,0,0,0.3)",
    lg: "0 15px 40px rgba(0,0,0,0.4)"
  },

  /* ================= TRANSITION ================= */
  transition: {
    fast: "0.15s ease",
    normal: "0.25s ease",
    slow: "0.4s ease"
  },

  /* ================= COMPONENT PRESETS ================= */
  components: {
    card: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "16px",
      transition: "0.25s ease"
    },

    button: {
      primary: {
        background: "var(--accent)",
        color: "#000",
        border: "none",
        padding: "8px 14px",
        borderRadius: "10px",
        cursor: "pointer",
        transition: "0.2s ease"
      },

      secondary: {
        background: "var(--card)",
        color: "var(--text)",
        border: "1px solid var(--border)",
        padding: "8px 14px",
        borderRadius: "10px",
        cursor: "pointer"
      }
    },

    input: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      padding: "8px 12px",
      borderRadius: "10px",
      color: "var(--text)",
      outline: "none"
    }
  }
};