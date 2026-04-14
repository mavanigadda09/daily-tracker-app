import { createContext, useContext, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timeouts = useRef(new Map());
  const audioRef = useRef(null);

  // ✅ SAFE SYSTEM NOTIFICATION (iPhone compatible)
  const safeNotify = (message) => {
    try {
      if (typeof window === "undefined") return;

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(message);
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification(message);
            } else {
              fallback(message);
            }
          });
        } else {
          fallback(message);
        }
      } else {
        fallback(message);
      }
    } catch {
      fallback(message);
    }
  };

  const fallback = (msg) => {
    // iPhone fallback
    alert(msg);
  };

  const showNotification = (message, type = "info") => {
    const id = crypto.randomUUID();

    const newNotif = { id, message, type };
    setNotifications((prev) => [...prev, newNotif]);

    // 🔊 SOUND (safe)
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
        );
        audioRef.current.volume = 0.3;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } catch {}

    // 📳 VIBRATION (safe)
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {}

    // 🔔 SYSTEM NOTIFICATION (NEW)
    safeNotify(message);

    // ⏳ AUTO REMOVE
    const timeout = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      timeouts.current.delete(id);
    }, 3000);

    timeouts.current.set(id, timeout);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      <div style={styles.container}>
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              style={{
                ...styles.toast,
                ...styles[n.type]
              }}
            >
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

const styles = {
  container: {
    position: "fixed",
    top: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    zIndex: 9999
  },

  toast: {
    padding: "12px 16px",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    minWidth: 220,
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
  },

  success: { background: "#22c55e" },
  error: { background: "#ef4444" },
  info: { background: "#3b82f6" }
};