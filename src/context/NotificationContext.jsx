import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

const TOAST_DURATION = 3500;
const MAX_NOTIFICATIONS = 5; // prevent stack overflow on rapid calls

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timeouts = useRef(new Map());
  const audioRef = useRef(null);

  // Request permission once on mount — not on every notification
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach((t) => clearTimeout(t));
      timeouts.current.clear();
    };
  }, []);

  const safeNotify = useCallback((message) => {
    try {
      if (typeof window === "undefined") return;
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Phoenix Tracker", {
          body: message,
          icon: "/phoenix.png",
        });
      }
    } catch (e) {
      console.warn("System notification failed:", e);
    }
  }, []);

  const showNotification = useCallback((message, type = "info") => {
    // Prevent toast flooding
    setNotifications((prev) => {
      if (prev.length >= MAX_NOTIFICATIONS) return prev;

      const id = crypto.randomUUID();

      // Sound — use local file, not external CDN
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio("/sounds/chime.ogg");
          audioRef.current.volume = 0.2;
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Autoplay blocked — silently ignore, don't crash
        });
      } catch {}

      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }

      // System push
      safeNotify(message);

      // Auto remove
      const timeout = setTimeout(() => {
        setNotifications((current) => current.filter((n) => n.id !== id));
        timeouts.current.delete(id);
      }, TOAST_DURATION);

      timeouts.current.set(id, timeout);

      return [...prev, { id, message, type }];
    });
  }, [safeNotify]);

  const dismissNotification = useCallback((id) => {
    clearTimeout(timeouts.current.get(id));
    timeouts.current.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification }}>
      {children}

      <div style={containerStyle}>
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              style={{ ...toastBase, ...toastVariants[n.type] ?? toastVariants.info }}
              onClick={() => dismissNotification(n.id)}
              role="alert"
              aria-live="polite"
            >
              <span aria-hidden="true" style={{ marginRight: 8 }}>
                {TOAST_ICONS[n.type] ?? "🔔"}
              </span>
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

// ─── Constants ──────────────────────────────────────────────
const TOAST_ICONS = {
  success: "✅",
  error:   "❌",
  warning: "⚠️",
  info:    "🔥",
};

const containerStyle = {
  position:      "fixed",
  bottom:        40,
  left:          "50%",
  transform:     "translateX(-50%)",
  display:       "flex",
  flexDirection: "column-reverse",
  gap:           12,
  zIndex:        10000,
  width:         "100%",
  maxWidth:      "360px",
  padding:       "0 20px",
  pointerEvents: "none",
};

const toastBase = {
  pointerEvents:  "auto",
  cursor:         "pointer",
  padding:        "14px 20px",
  borderRadius:   "25px",
  fontSize:       "14px",
  fontWeight:     "bold",
  textAlign:      "center",
  boxShadow:      "0 10px 30px rgba(0,0,0,0.4)",
  backdropFilter: "blur(8px)",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  border:         "1px solid rgba(255,255,255,0.1)",
  userSelect:     "none",
};

const toastVariants = {
  success: {
    background: "linear-gradient(135deg, #facc15, #f97316)",
    color:      "#020617",
  },
  error: {
    background: "#ef4444",
    color:      "#ffffff",
  },
  warning: {
    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
    color:      "#020617",
  },
  info: {
    background: "rgba(255, 255, 255, 0.95)",
    color:      "#020617",
  },
};