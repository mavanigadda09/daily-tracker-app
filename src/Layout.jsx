import { Link, useLocation, Outlet } from "react-router-dom";
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
  Dumbbell,
  MessageCircle,
  Wallet
} from "lucide-react";

export default function Layout({ user, onLogout, theme, setTheme }) {

  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/habits", label: "Habits", icon: CheckSquare },
    { path: "/tasks", label: "Tasks", icon: ListTodo },
    { path: "/activities", label: "Activities", icon: Activity },
    { path: "/weight", label: "Weight", icon: Dumbbell },
    { path: "/finance", label: "Finance", icon: Wallet },
    { path: "/chat", label: "AI Chat", icon: MessageCircle },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/insights", label: "Insights", icon: Lightbulb },
    { path: "/profile", label: "Profile", icon: User }
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 240 }}
        transition={{ duration: 0.25 }}
        style={styles.sidebar}
      >

        {/* TOP */}
        <div>
          <div style={styles.topRow}>

            {!collapsed && <h2 style={styles.logo}>🚀 Tracker</h2>}

            <div style={{ display: "flex", gap: 8 }}>

              {/* THEME */}
              <button
                style={styles.iconBtn}
                onClick={() =>
                  setTheme(prev => prev === "dark" ? "light" : "dark")
                }
              >
                {theme === "dark" ? "🌞" : "🌙"}
              </button>

              {/* MENU */}
              <button
                style={styles.iconBtn}
                onClick={() => setCollapsed(prev => !prev)}
              >
                <Menu size={18} />
              </button>

            </div>
          </div>

          {/* NAV */}
          <nav style={styles.nav}>
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : ""}
                  style={{
                    ...styles.link,
                    ...(active ? styles.active : {})
                  }}
                >

                  {active && <div style={styles.activeBar} />}

                  <Icon size={18} />

                  {!collapsed && <span>{item.label}</span>}

                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM */}
        <div style={styles.bottom}>

          {!collapsed && (
            <div style={styles.userBox}>
              <div style={styles.avatar}>👤</div>
              <div>
                <p style={styles.userName}>
                  {user?.name || "User"}
                </p>
                <p style={styles.userSub}>Active</p>
              </div>
            </div>
          )}

          <button style={styles.logout} onClick={onLogout}>
            {collapsed ? "⏻" : "Logout"}
          </button>

        </div>

      </motion.aside>

      {/* MAIN */}
      <main style={styles.main}>
        <Outlet />
      </main>

    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg)"
  },

  sidebar: {
    background: "var(--sidebar)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid var(--border)"
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  logo: {
    fontWeight: "600",
    color: "var(--text)"
  },

  iconBtn: {
    background: "var(--card)",
    border: "none",
    color: "var(--text)",
    cursor: "pointer",
    padding: 6,
    borderRadius: 8
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },

  link: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    borderRadius: 10,
    textDecoration: "none",
    color: "var(--text-muted)",
    transition: "0.2s"
  },

  active: {
    background: "rgba(34,197,94,0.15)",
    color: "var(--accent)"
  },

  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 4,
    background: "var(--accent)"
  },

  bottom: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    background: "var(--card)",
    borderRadius: 12
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  userName: {
    margin: 0,
    fontSize: 14,
    color: "var(--text)"
  },

  userSub: {
    margin: 0,
    fontSize: 12,
    color: "var(--text-muted)"
  },

  logout: {
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: 24
  }
};