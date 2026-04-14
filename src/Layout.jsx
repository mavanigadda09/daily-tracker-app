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
  MessageCircle,
  Wallet
} from "lucide-react";

export default function Layout({ user, onLogout, theme, setTheme }) {

  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // ✅ UPDATED NAV (Weight removed, Health merged)
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/habits", label: "Health", icon: CheckSquare }, // 🔥 renamed
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

  const s = styles;

  return (
    <div style={s.container}>

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 240 }}
        transition={{ duration: 0.25 }}
        style={s.sidebar}
      >

        {/* TOP */}
        <div>
          <div style={s.topRow}>

            {!collapsed && (
              <div style={s.logoWrapper}>
                <img
                  src="/phoenix.png"
                  alt="phoenix"
                  style={s.logoImg}
                />
                <h2 style={s.logoText}>Tracker</h2>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>

              {/* THEME */}
              <button
                style={s.iconBtn}
                onClick={() =>
                  setTheme(prev => prev === "dark" ? "light" : "dark")
                }
              >
                {theme === "dark" ? "🌞" : "🌙"}
              </button>

              {/* MENU */}
              <button
                style={s.iconBtn}
                onClick={() => setCollapsed(prev => !prev)}
              >
                <Menu size={18} />
              </button>

            </div>
          </div>

          {/* NAV */}
          <nav style={s.nav}>
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : ""}
                  style={{
                    ...s.link,
                    ...(active ? s.active : {})
                  }}
                >

                  {active && <div style={s.activeBar} />}

                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}

                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM */}
        <div style={s.bottom}>

          {!collapsed && (
            <div style={s.userBox}>
              <div style={s.avatar}>👤</div>
              <div>
                <p style={s.userName}>
                  {user?.name || "User"}
                </p>
                <p style={s.userSub}>Active</p>
              </div>
            </div>
          )}

          <button style={s.logout} onClick={onLogout}>
            {collapsed ? "⏻" : "Logout"}
          </button>

        </div>

      </motion.aside>

      {/* MAIN */}
      <main style={s.main}>
        <Outlet />
      </main>

    </div>
  );
}


// ================= STYLES =================

const styles = Object.freeze({
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #0f172a, #020617)"
  },

  sidebar: {
    background: "#020617",
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
    objectFit: "contain",
    filter: "drop-shadow(0 0 10px #facc15)"
  },

  logoText: {
    margin: 0,
    fontWeight: 600,
    color: "#facc15",
    textShadow: "0 0 10px #facc15"
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
    textDecoration: "none",
    color: "#94a3b8",
    transition: "0.2s"
  },

  active: {
    background: "rgba(250,204,21,0.15)",
    color: "#facc15",
    boxShadow: "0 0 10px rgba(250,204,21,0.4)"
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
    background: "#0f172a",
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
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: 24
  }
});