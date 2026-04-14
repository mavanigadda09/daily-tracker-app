import { Link, useLocation, Outlet } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Activity,
  BarChart3,
  User,
  Menu,
  MessageCircle,
  Wallet
} from "lucide-react";

export default function Layout({ user, onLogout, theme, setTheme }) {

  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/habits", label: "Health", icon: CheckSquare },
    { path: "/tasks", label: "Tasks", icon: ListTodo },
    { path: "/activities", label: "Activities", icon: Activity },
    { path: "/finance", label: "Finance", icon: Wallet },
    { path: "/chat", label: "AI Chat", icon: MessageCircle },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: User }
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div
      style={{
        ...styles.container,
        background:
          theme === "dark"
            ? "radial-gradient(circle at top, #0f172a, #020617)"
            : "#f8fafc",
        color: theme === "dark" ? "#fff" : "#000"
      }}
    >

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 240 }}
        transition={{ duration: 0.25 }}
        style={{
          ...styles.sidebar,
          background: theme === "dark" ? "#020617" : "#ffffff"
        }}
      >

        {/* TOP */}
        <div>
          <div style={styles.topRow}>

            {!collapsed && (
              <div style={styles.logoWrapper}>
                <img
                  src="/phoenix.png"
                  alt="logo"
                  style={styles.logoImg}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <h2 style={{
                  ...styles.logoText,
                  color: theme === "dark" ? "#facc15" : "#f59e0b"
                }}>
                  Tracker
                </h2>
              </div>
            )}

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
                  style={{
                    ...styles.link,
                    color: theme === "dark" ? "#94a3b8" : "#334155",
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
            <div style={{
              ...styles.userBox,
              background: theme === "dark" ? "#0f172a" : "#f1f5f9"
            }}>
              <div style={styles.avatar}>👤</div>
              <div>
                <p style={{
                  ...styles.userName,
                  color: theme === "dark" ? "#fff" : "#000"
                }}>
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


/* ================= STYLES ================= */

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh"
  },

  sidebar: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid rgba(250,204,21,0.15)"
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },

  logoImg: {
    width: 36,
    height: 36,
    objectFit: "contain"
  },

  logoText: {
    margin: 0,
    fontWeight: 600
  },

  iconBtn: {
    background: "#0f172a",
    border: "none",
    color: "#fff",
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
    textDecoration: "none"
  },

  active: {
    background: "rgba(250,204,21,0.15)",
    color: "#facc15"
  },

  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 4,
    background: "#facc15"
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
    borderRadius: 12
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#facc15",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  userName: {
    margin: 0,
    fontSize: 14
  },

  userSub: {
    margin: 0,
    fontSize: 12,
    color: "#94a3b8"
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
    padding: 24,
    background: "inherit",
    color: "inherit"
  }
};