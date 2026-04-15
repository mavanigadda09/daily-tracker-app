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

/* ================= SAFE CALL ================= */
const safeCall = (fn, ...args) => {
  if (typeof fn === "function") {
    return fn(...args);
  } else {
    console.error("❌ Not a function:", fn);
  }
};

export default function Layout({
  user = {},
  onLogout = () => {},
  theme = "dark",
  setTheme = () => {}
}) {

  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/habits", label: "Health", icon: CheckSquare },
    { path: "/productivity", label: "Productivity" }
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
                <h2 style={styles.logoText}>Tracker</h2>
              </div>
            )}

            <div style={styles.iconGroup}>

              {/* THEME */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                style={styles.iconBtn}
                onClick={() =>
                  safeCall(setTheme, prev => prev === "dark" ? "light" : "dark")
                }
              >
                {theme === "dark" ? "🌞" : "🌙"}
              </motion.button>

              {/* MENU */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                style={styles.iconBtn}
                onClick={() => setCollapsed(prev => !prev)}
              >
                <Menu size={18} />
              </motion.button>

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

          <button
            style={styles.logout}
            onClick={() => safeCall(onLogout)}
          >
            {collapsed ? "⏻" : "Logout"}
          </button>

        </div>

      </motion.aside>

      {/* MAIN */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={styles.main}
      >
        <Outlet />
      </motion.main>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)"
  },

  sidebar: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid var(--border)",
    background: "var(--sidebar)"
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
    height: 36
  },

  logoText: {
    margin: 0,
    fontWeight: 600,
    color: "var(--accent)"
  },

  iconGroup: {
    display: "flex",
    gap: 8
  },

  iconBtn: {
    background: "var(--card)",
    border: "1px solid var(--border)",
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
    background: "var(--card-hover)",
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
    borderRadius: 12,
    background: "var(--card)"
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
    fontSize: 14
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
    background: "var(--danger)",
    color: "#fff",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: 24
  }
};