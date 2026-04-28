import { Link, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, BarChart3,
  User, Menu, MessageCircle, Wallet, Activity,
  LogOut, Sun, Moon, CalendarDays, Target,
  Heart, MoreHorizontal, X,
} from "lucide-react";

// ─── Nav config ─────────────────────────────────────────────────────────────
const ALL_NAV = [
  { path: "/",             label: "Home",         Icon: LayoutDashboard },
  { path: "/health",       label: "Health",        Icon: Heart           },
  { path: "/productivity", label: "Tasks",         Icon: Activity        },
  { path: "/finance",      label: "Finance",       Icon: Wallet          },
  { path: "/profile",      label: "Profile",       Icon: User            },
  // "More" overflow ↓
  { path: "/goals",        label: "Goals",         Icon: Target          },
  { path: "/routines",     label: "Routines",      Icon: CalendarDays    },
  { path: "/chat",         label: "AI Chat",       Icon: MessageCircle   },
  { path: "/analytics",    label: "Analytics",     Icon: BarChart3       },
];

const PRIMARY_TABS = ALL_NAV.slice(0, 4);
const MORE_ITEMS   = ALL_NAV.slice(4); // includes Profile + overflow
const SIDEBAR_NAV  = ALL_NAV;

const isActive = (itemPath, pathname) => {
  if (itemPath === "/") return pathname === "/";
  return pathname === itemPath || pathname.startsWith(itemPath + "/");
};

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function Layout({ user = {}, onLogout, theme = "dark", onThemeToggle }) {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar_collapsed") === "true"; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("sidebar_collapsed", String(collapsed)); }
    catch {}
  }, [collapsed]);

  const isCapacitorNative = !!(window.Capacitor?.isNativePlatform?.());
  const [isMobile, setIsMobile] = useState(
    () => isCapacitorNative || window.innerWidth < 768
  );
  useEffect(() => {
    if (isCapacitorNative) return;
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isCapacitorNative]);

  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const avatarUrl   = user?.photoURL || null;
  const displayName = user?.displayName?.trim() || user?.name?.trim() || "User";
  const initial     = displayName.charAt(0).toUpperCase();

  const moreActive = MORE_ITEMS.some(({ path }) => isActive(path, location.pathname));

  return (
    <div style={s.container}>

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <motion.aside
          animate={{ width: collapsed ? 64 : 232 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={s.sidebar}
          aria-label="Main navigation"
        >
          <div>
            <div style={s.topRow}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={s.logoWrapper}
                  >
                    <img src="/phoenix.png" alt="" style={s.logoImg}
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <span style={s.logoText}>Phoenix</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={s.iconGroup}>
                <motion.button whileTap={{ scale: 0.9 }} style={s.iconBtn}
                  onClick={() => onThemeToggle?.()} aria-label="Toggle theme">
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} style={s.iconBtn}
                  onClick={() => setCollapsed(p => !p)} aria-label="Toggle sidebar">
                  <Menu size={15} />
                </motion.button>
              </div>
            </div>

            <nav>
              {SIDEBAR_NAV.map(({ path, label, Icon }) => {
                const active = isActive(path, location.pathname);
                return (
                  <Link key={path} to={path} style={{
                    ...s.link,
                    ...(active ? s.linkActive : {}),
                    justifyContent: collapsed ? "center" : "flex-start",
                  }} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined}>
                    {active && <div style={s.activeBar} />}
                    <Icon size={17} style={{ flexShrink: 0 }} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }}
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }} style={s.userBox}>
                  <Avatar url={avatarUrl} initial={initial} size={32} />
                  <div style={{ overflow: "hidden" }}>
                    <p style={s.userName}>{displayName}</p>
                    <p style={s.userSub}>Active</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button style={s.logoutBtn} onClick={() => onLogout?.()} aria-label="Log out">
              <LogOut size={15} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }}
                    style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                    Log out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.aside>
      )}

      {/* ── Page content ── */}
      {/*
        FIX: contentWrapper needs explicit height so <main> can be the scroll root.
        Without height: 0 + flex: 1, the flex child expands to content height and
        the *outer* container scrolls — which fights the position:fixed bottom nav.
        On desktop, height: 0 + flex: 1 + overflow: hidden on the column wrapper
        forces <main> to fill exactly the remaining viewport height.
        On mobile, same trick but paddingBottom provides nav clearance.
      */}
      <div style={{
        ...s.contentWrapper,
        paddingBottom: isMobile ? "calc(60px + env(safe-area-inset-bottom))" : 0,
      }}>
        {/* Mobile top bar
            FIX: paddingTop now includes env(safe-area-inset-top) for Android
                 status bar on devices with notches/cutouts. */}
        {isMobile && (
          <div style={s.mobileTopBar}>
            <div style={s.mobileLogoRow}>
              <img src="/phoenix.png" alt="" style={{ width: 24, height: 24 }}
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <span style={s.logoText}>Phoenix</span>
            </div>
            <button style={s.iconBtn} onClick={() => onThemeToggle?.()}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            style={{
              ...s.main,
              padding: isMobile ? "12px 16px 20px" : "24px",
            }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <>
          {/* "More" drawer backdrop */}
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={s.backdrop}
                onClick={() => setMoreOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* "More" drawer */}
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                style={s.moreDrawer}
              >
                <div style={s.moreHandle} />
                <div style={s.moreHeader}>
                  <span style={s.moreTitle}>More</span>
                  <button style={s.moreClose} onClick={() => setMoreOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div style={s.moreGrid}>
                  {MORE_ITEMS.map(({ path, label, Icon }) => {
                    const active = isActive(path, location.pathname);
                    return (
                      <Link key={path} to={path} style={{
                        ...s.moreItem,
                        background: active
                          ? "var(--color-background-info, rgba(99,102,241,0.15))"
                          : "var(--color-background-primary, rgba(255,255,255,0.04))",
                        color: active
                          ? "var(--color-text-info, #818cf8)"
                          : "var(--color-text-secondary, #9ca3af)",
                      }}>
                        <Icon size={22} />
                        <span style={s.moreItemLabel}>{label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* User + logout inside drawer */}
                <div style={s.drawerBottom}>
                  <div style={s.drawerUserRow}>
                    <Avatar url={avatarUrl} initial={initial} size={36} />
                    <div>
                      <p style={s.userName}>{displayName}</p>
                      <p style={s.userSub}>Active</p>
                    </div>
                  </div>
                  <button style={s.logoutBtn} onClick={() => onLogout?.()}>
                    <LogOut size={15} />
                    <span>Log out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom tab bar */}
          <nav style={s.bottomNav} aria-label="Main navigation">
            {PRIMARY_TABS.map(({ path, label, Icon }) => {
              const active = isActive(path, location.pathname);
              return (
                <Link key={path} to={path} style={{
                  ...s.tabItem,
                  color: active
                    ? "var(--color-text-info, #818cf8)"
                    : "var(--color-text-tertiary, #6b7280)",
                }} aria-current={active ? "page" : undefined}>
                  <div style={{
                    ...s.tabIconWrap,
                    background: active ? "var(--color-background-info, rgba(99,102,241,0.15))" : "transparent",
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={s.tabLabel}>{label}</span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              style={{
                ...s.tabItem,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: moreOpen || moreActive
                  ? "var(--color-text-info, #818cf8)"
                  : "var(--color-text-tertiary, #6b7280)",
              }}
              onClick={() => setMoreOpen(p => !p)}
              aria-label="More navigation"
            >
              <div style={{
                ...s.tabIconWrap,
                background: moreOpen || moreActive
                  ? "var(--color-background-info, rgba(99,102,241,0.15))"
                  : "transparent",
              }}>
                <MoreHorizontal size={20} />
              </div>
              <span style={s.tabLabel}>More</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ url, initial, size = 32 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const base = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
  };
  if (url && !imgFailed) {
    return (
      <div style={base}>
        <img src={url} alt="" width={size} height={size}
          style={{ borderRadius: "50%", objectFit: "cover" }}
          onError={() => setImgFailed(true)} referrerPolicy="no-referrer" />
      </div>
    );
  }
  return (
    <div style={{
      ...base,
      background: "var(--color-background-info, rgba(99,102,241,0.2))",
      color: "var(--color-text-info, #818cf8)",
      fontSize: size * 0.4, fontWeight: 600,
    }}>
      {initial}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  container: {
    display: "flex",
    // FIX: 100dvh instead of 100vh — on Android Chrome, 100vh includes the
    // browser UI chrome and causes a scroll bleed. 100dvh is the visible height.
    height: "100dvh",
    overflow: "hidden",           // ← clip at container level
    background: "var(--color-background-tertiary)",
    color: "var(--color-text-primary)",
  },
  // Sidebar (desktop)
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
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20, minHeight: 36,
  },
  logoWrapper: { display: "flex", alignItems: "center", gap: 8, overflow: "hidden" },
  logoImg:     { width: 28, height: 28, flexShrink: 0 },
  logoText:    { margin: 0, fontWeight: 700, fontSize: 15, color: "var(--color-text-primary)", whiteSpace: "nowrap" },
  iconGroup:   { display: "flex", gap: 6, flexShrink: 0 },
  iconBtn: {
    background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-secondary)",
    color: "var(--color-text-secondary)",
    cursor: "pointer", padding: 6, borderRadius: 6,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  link: {
    position: "relative", display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px", borderRadius: 8, textDecoration: "none",
    color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 2,
    transition: "background 0.15s", overflow: "hidden",
  },
  linkActive: { background: "var(--color-background-primary)", color: "var(--color-text-info)", fontWeight: 500 },
  activeBar: {
    position: "absolute", left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2, background: "var(--color-text-info)",
  },
  bottom:  { display: "flex", flexDirection: "column", gap: 8 },
  userBox: {
    display: "flex", alignItems: "center", gap: 8, padding: "8px 6px",
    borderRadius: 10, background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-tertiary)", overflow: "hidden",
  },
  userName: { margin: 0, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userSub:  { margin: 0, fontSize: 11, color: "var(--color-text-success)" },
  logoutBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "8px 12px", borderRadius: 8,
    border: "1px solid var(--color-border-danger)", background: "transparent",
    color: "var(--color-text-danger)", cursor: "pointer", fontSize: 13,
    overflow: "hidden", whiteSpace: "nowrap",
  },
  // FIX: height: "100%" + overflow: "hidden" on contentWrapper makes it fill
  // exactly the remaining flex space. The <main> child then gets flex:1 + overflowY:auto
  // and becomes the sole scroll root — the fixed bottom nav never gets buried.
  contentWrapper: {
    flex: 1,
    minWidth: 0,
    height: "100%",           // ← fills container height exactly
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",       // ← clips, lets <main> own the scroll
  },
  // FIX: flex: 1 + overflowY: "auto" + minHeight: 0
  // minHeight: 0 is the crucial piece — without it, a flex child's min-height
  // defaults to "auto" (content height), defeating the overflow clipping.
  main: {
    flex: 1,
    minHeight: 0,             // ← allows flex child to shrink below content height
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch", // smooth momentum scroll on iOS/Android WebView
  },

  // Mobile top bar
  // FIX: paddingTop now includes env(safe-area-inset-top) so content doesn't
  // render under the Android status bar on devices with display cutouts.
  mobileTopBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    paddingBottom: "8px",
    paddingLeft: "16px",
    paddingRight: "16px",
    borderBottom: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    flexShrink: 0,  // ← don't let top bar shrink when content is tall
  },
  mobileLogoRow: { display: "flex", alignItems: "center", gap: 8 },

  // Bottom tab bar
  // height uses calc with env() so the bar extends into the gesture nav area
  // but the interactive content stays above it (via paddingBottom on contentWrapper).
  bottomNav: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    height: "calc(60px + env(safe-area-inset-bottom))",
    paddingBottom: "env(safe-area-inset-bottom)",
    display: "flex",
    background: "var(--color-background-secondary)",
    borderTop: "1px solid var(--color-border-tertiary)",
    zIndex: 100,
  },
  tabItem: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textDecoration: "none", gap: 2, padding: "6px 0",
    transition: "color 0.15s",
    // Minimum 44px touch target height (iOS HIG / Material guidelines)
    minHeight: 44,
  },
  tabIconWrap: {
    width: 40, height: 32, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
  },
  tabLabel: { fontSize: 10, fontWeight: 500, letterSpacing: "0.02em" },

  // More drawer
  backdrop: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 200,
  },
  moreDrawer: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "var(--color-background-secondary)",
    borderRadius: "20px 20px 0 0",
    border: "1px solid var(--color-border-tertiary)",
    zIndex: 201,
    padding: "0 20px calc(20px + env(safe-area-inset-bottom))",
  },
  moreHandle: {
    width: 36, height: 4, borderRadius: 2,
    background: "var(--color-border-secondary, rgba(255,255,255,0.15))",
    margin: "12px auto 8px",
  },
  moreHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0 16px",
  },
  moreTitle: { fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" },
  moreClose: {
    background: "var(--color-background-primary)", border: "1px solid var(--color-border-secondary)",
    borderRadius: 8, padding: 6, cursor: "pointer",
    color: "var(--color-text-secondary)", display: "flex", alignItems: "center",
  },
  moreGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 10, marginBottom: 20,
  },
  moreItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 16px", borderRadius: 12,
    textDecoration: "none", transition: "background 0.15s",
  },
  moreItemLabel: { fontSize: 14, fontWeight: 500 },
  drawerBottom: { borderTop: "1px solid var(--color-border-tertiary)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 },
  drawerUserRow: { display: "flex", alignItems: "center", gap: 10, padding: "4px 0" },
};