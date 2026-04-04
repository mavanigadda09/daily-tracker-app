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

export default function Layout({ user, onLogout }) {
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

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 240 }}
        transition={{ duration: 0.3 }}
        style={styles.sidebar}
      >
        {/* TOP */}
        <div>
          <div style={styles.topRow}>
            {!collapsed && (
              <h2 style={styles.logo}>🚀 Tracker</h2>
            )}

            <button
              style={styles.menuBtn}
              onClick={() => setCollapsed((prev) => !prev)}
            >
              <Menu size={20} />
            </button>
          </div>

          {/* NAV */}
          <div style={styles.nav}>
            {navItems.map((item) => {
              const active =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");

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
                  {/* ACTIVE BAR */}
                  {active && <div style={styles.activeBar} />}

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
            <div style={styles.userBox}>
              <div style={styles.avatar}>👤</div>
              <div>
                <p style={styles.userName}>{user?.name || "User"}</p>
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

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f172a"
  },

  sidebar: {
    background: "linear-gradient(180deg, #020617, #020617)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid rgba(255,255,255,0.05)"
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  logo: {
    fontWeight: "600",
    color: "#fff"
  },

  menuBtn: {
    background: "rgba(255,255,255,0.05)",
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
    textDecoration: "none",
    color: "#94a3b8",
    transition: "0.2s",
    fontSize: 14
  },

  active: {
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80"
  },

  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 4,
    background: "#22c55e"
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
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  userName: {
    margin: 0,
    fontSize: 14,
    color: "#fff"
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
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: 24,
    overflowX: "hidden"
  }
};