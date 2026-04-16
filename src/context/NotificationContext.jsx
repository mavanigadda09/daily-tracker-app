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

  // ✅ SYSTEM NOTIFICATION (Push support)
  const safeNotify = (message) => {
    try {
      if (typeof window === "undefined") return;
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Phoenix", { body: message, icon: "/phoenix.png" });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("Phoenix", { body: message, icon: "/phoenix.png" });
            }
          });
        }
      }
    } catch (e) {
      console.warn("System notification blocked or unsupported.");
    }
  };

  const showNotification = (message, type = "info") => {
    const id = crypto.randomUUID();
    const newNotif = { id, message, type };
    
    setNotifications((prev) => [...prev, newNotif]);

    // 🔊 PHOENIX CHIME (Subtle)
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
        audioRef.current.volume = 0.2;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } catch {}

    // 📳 HAPTIC FEEDBACK
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }

    // 🔔 TRIGGER SYSTEM PUSH
    safeNotify(message);

    // ⏳ AUTO REMOVE
    const timeout = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      timeouts.current.delete(id);
    }, 3500);

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
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              style={{
                ...styles.toast,
                ...styles[n.type]
              }}
            >
              <span style={{ marginRight: '8px' }}>🔥</span>
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
    bottom: 40, // Thumb-friendly bottom placement
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column-reverse", // Newest on bottom
    gap: 12,
    zIndex: 10000,
    width: "100%",
    maxWidth: "350px",
    padding: "0 20px",
    pointerEvents: "none"
  },

  toast: {
    pointerEvents: "auto",
    padding: "14px 20px",
    borderRadius: "25px", // Capsule shape
    color: "#020617", // Midnight blue text for contrast
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.1)"
  },

  // Phoenix Theme Types
  success: { 
    background: "linear-gradient(135deg, #facc15, #f97316)", // Gold to Orange
  },
  error: { 
    background: "#ef4444",
    color: "#fff"
  },
  info: { 
    background: "rgba(255, 255, 255, 0.95)",
    color: "#020617"
  }
};