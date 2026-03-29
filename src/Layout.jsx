import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Activity,
  BarChart3,
  Lightbulb,
  Menu,
  Sun,
  Moon
} from "lucide-react";

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // 🌗 THEME STATE
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/habits", label: "Habits", icon: CheckSquare },
    { path: "/tasks", label: "Tasks", icon: ListTodo },
    { path: "/activities", label: "Activities", icon: Activity },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/insights", label: "Insights", icon: Lightbulb }
  ];

  return (
    <div
      style={{
        ...styles.container,
        background: dark ? "#020617" : "#f8fafc",
        color: dark ? "#e2e8f0" : "#111827"
      }}
    >

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 220 }}
        style={{
          ...styles.sidebar,
          background: dark ? "#020617" : "#ffffff",
          borderRight: dark
            ? "1px solid #1e293b"
            : "1px solid #e5e7eb"
        }}
      >

        {/* TOP */}
        <div>
          <div style={styles.topRow}>
            {!collapsed && <h2 style={styles.logo}>🚀 Tracker</h2>}

            <button
              style={styles.menuBtn}
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={20} />
            </button>
          </div>

          {/* NAV */}
          <div style={styles.nav}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.link,
                    color: dark ? "#94a3b8" : "#6b7280",
                    ...(active
                      ? {
                          background: "#6366f1",
                          color: "#fff"
                        }
                      : {})
                  }}
                >
                  <Icon size={18} />

                  {!collapsed && (
                    <span style={styles.label}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* BOTTOM */}
        <div style={styles.bottom}>
          {/* THEME TOGGLE */}
          <button
            style={styles.themeBtn}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (
              <span style={{ marginLeft: 8 }}>
                {dark ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          {!collapsed && (
            <p style={styles.user}>
              👤 {user?.name || "User"}
            </p>
          )}

          <button style={styles.logout} onClick={onLogout}>
            {collapsed ? "⎋" : "Logout"}
          </button>
        </div>

      </motion.aside>

      {/* MAIN */}
      <main style={styles.main}>
        {children}
      </main>

    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    transition: "0.3s"
  },

  sidebar: {
    padding: 15,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "0.3s"
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  logo: {
    fontSize: 18
  },

  menuBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer"
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 8,
    transition: "0.2s"
  },

  label: {
    fontSize: 14
  },

  bottom: {
    marginTop: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  user: {
    fontSize: 14
  },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  themeBtn: {
    background: "#6366f1",
    border: "none",
    padding: "8px 10px",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center"
  },

  main: {
    flex: 1,
    padding: 20
  }
};