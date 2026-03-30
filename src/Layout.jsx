import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Activity,
  BarChart3,
  Lightbulb,
  User,
  Menu,
  Dumbbell   // 🔥 NEW ICON
} from "lucide-react";

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/habits", label: "Habits", icon: CheckSquare },
    { path: "/tasks", label: "Tasks", icon: ListTodo },
    { path: "/activities", label: "Activities", icon: Activity },

    { path: "/weight", label: "Weight", icon: Dumbbell }, // 🔥 ADDED

    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/insights", label: "Insights", icon: Lightbulb },
    { path: "/profile", label: "Profile", icon: User }
  ];

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 230 }}
        style={styles.sidebar}
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
                    ...(active ? styles.active : {})
                  }}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* BOTTOM */}
        <div style={styles.bottom}>
          {!collapsed && (
            <p style={styles.user}>👤 {user?.name}</p>
          )}

          <button style={styles.logout} onClick={onLogout}>
            Logout
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
    width: "100%",
    minHeight: "100vh"
  },

  sidebar: {
    background: "var(--sidebar)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    height: "100vh"
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  logo: {
    fontWeight: "bold",
    color: "var(--text)"
  },

  menuBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
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
    padding: "10px 12px",
    borderRadius: 8,
    textDecoration: "none",
    color: "var(--text-muted)",
    transition: "0.2s"
  },

  active: {
    background: "var(--accent)",
    color: "#fff"
  },

  bottom: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  user: {
    fontSize: 14,
    color: "var(--text)"
  },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: 24,
    width: "100%",
    minWidth: 0,
    overflowX: "hidden"
  }
};