import { Link, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, BarChart3,
  User, Menu, MessageCircle, Wallet, Activity,
  LogOut, Sun, Moon, CalendarDays, Target,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/",             label: "Dashboard",    Icon: LayoutDashboard },
  { path: "/habits",       label: "Health",       Icon: CheckSquare     },
  { path: "/productivity", label: "Productivity", Icon: Activity        },
  { path: "/goals",        label: "Goals",        Icon: Target          },
  { path: "/routines",     label: "Routines",     Icon: CalendarDays    },
  { path: "/finance",      label: "Finance",      Icon: Wallet          },
  { path: "/chat",         label: "AI Chat",      Icon: MessageCircle   },
  { path: "/analytics",    label: "Analytics",    Icon: BarChart3       },
  { path: "/profile",      label: "Profile",      Icon: User            },
];

const isActive = (itemPath, pathname) => {
  if (itemPath === "/") return pathname === "/";
  return pathname === itemPath || pathname.startsWith(itemPath + "/");
};

export default function Layout({
  user = {},
  onLogout,
  theme = "dark",
  onThemeToggle,
}) {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar_collapsed") === "true"; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("sidebar_collapsed", String(collapsed)); }
    catch {}
  }, [collapsed]);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const avatarUrl   = user?.photoURL || null;
  // .trim() ensures "" falls through to the next option, not just null/undefined
  const displayName = user?.displayName?.trim() || user?.name?.trim() || "User";
  const initial     = displayName.charAt(0).toUpperCase();

  return (
    <div style={s.container}>

      {!isMobile && (
        <motion.aside
          animate={{ width: collapsed ? 64 : 232 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={s.sidebar}
          aria-label="Main navigation"
          overflow="hidden"
        >
          <div>
            <div style={s.topRow}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={s.logoWrapper}
                  >
                    <img
                      src="/phoenix.png"
                      alt=""
                      style={s.logoImg}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <span style={s.logoText}>Phoenix</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={s.iconGroup}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  style={s.iconBtn}
                  onClick={() => onThemeToggle?.()}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  style={s.iconBtn}
                  onClick={() => setCollapsed((p) => !p)}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <Menu size={15} />
                </motion.button>
              </div>
            </div>

            <nav>
              {NAV_ITEMS.map(({ path, label, Icon }) => {
                const active = isActive(path, location.pathname);
                return (
                  <Link
                    key={path}
                    to={path}
                    style={{
                      ...s.link,
                      ...(active ? s.linkActive : {}),
                      justifyContent: collapsed ? "center" : "flex-start",
                    }}
                    title={collapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && <div style={s.activeBar} />}
                    <Icon size={17} style={{ flexShrink: 0 }} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div style={s.bottom}>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={s.userBox}
                >
                  <Avatar url={avatarUrl} initial={initial} size={32} />
                  <div style={{ overflow: "hidden" }}>
                    <p style={s.userName}>{displayName}</p>
                    <p style={s.userSub}>Active</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              style={s.logoutBtn}
              onClick={() => onLogout?.()}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={15} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                  >
                    Log out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.aside>
      )}

      <div style={s.contentWrapper}>
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            style={s.main}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {isMobile && (
        <nav style={s.bottomNav} aria-label="Main navigation">
          {NAV_ITEMS.map(({ path, label, Icon }) => {
            const active = isActive(path, location.pathname);
            return (
              <Link
                key={path}
                to={path}
                style={{
                  ...s.bottomNavItem,
                  color: active
                    ? "var(--color-text-info)"
                    : "var(--color-text-tertiary)",
                }}
                aria-current={active ? "page" : undefined}
                aria-label={label}
              >
                <Icon size={20} />
                <span style={s.bottomNavLabel}>{label}</span>
              </Link>
            );
          })}
        </nav>
      )}

    </div>
  );
}

function Avatar({ url, initial, size = 32 }) {
  const [imgFailed, setImgFailed] = useState(false);

  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (url && !imgFailed) {
    return (
      <div style={base}>
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          style={{ borderRadius: "50%", objectFit: "cover" }}
          onError={() => setImgFailed(true)}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div style={{
      ...base,
      background: "var(--color-background-info)",
      color: "var(--color-text-info)",
      fontSize: size * 0.4,
      fontWeight: 600,
    }}>
      {initial}
    </div>
  );
}

const s = {
  container: {
    display: "flex",
    minHeight: "100dvh",
    background: "var(--color-background-tertiary)",
    color: "var(--color-text-primary)",
  },
  sidebar: {
    padding: "16px 10px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    overflow: "hidden",
    flexShrink: 0,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    minHeight: 36,
  },
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  logoImg: {
    width: 28,
    height: 28,
    flexShrink: 0,
  },
  logoText: {
    margin: 0,
    fontWeight: 700,
    fontSize: 15,
    color: "var(--color-text-primary)",
    whiteSpace: "nowrap",
  },
  iconGroup: {
    display: "flex",
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-secondary)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 8,
    textDecoration: "none",
    color: "var(--color-text-secondary)",
    fontSize: 14,
    marginBottom: 2,
    transition: "background 0.15s",
    overflow: "hidden",
  },
  linkActive: {
    background: "var(--color-background-primary)",
    color: "var(--color-text-info)",
    fontWeight: 500,
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    background: "var(--color-text-info)",
  },
  bottom: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  userBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 6px",
    borderRadius: 10,
    background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-tertiary)",
    overflow: "hidden",
  },
  userName: {
    margin: 0,
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userSub: {
    margin: 0,
    fontSize: 11,
    color: "var(--color-text-success)",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border-danger)",
    background: "transparent",
    color: "var(--color-text-danger)",
    cursor: "pointer",
    fontSize: 13,
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  contentWrapper: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
    padding: 24,
    overflowY: "auto",
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    display: "flex",
    background: "var(--color-background-secondary)",
    borderTop: "1px solid var(--color-border-tertiary)",
    zIndex: 100,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  bottomNavItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    gap: 2,
    transition: "color 0.15s",
  },
  bottomNavLabel: {
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
};