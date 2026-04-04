import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = "info") => {
  const id = Date.now();

  const newNotif = { id, message, type };
  setNotifications((prev) => [...prev, newNotif]);

  // 🔊 SOUND
  try {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
    );
    audio.volume = 0.3;
    audio.play();
  } catch {}

  // 📳 VIBRATION (mobile)
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }

  // ⏳ AUTO REMOVE
  setTimeout(() => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== id)
    );
  }, 3000);
};

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* TOAST UI */}
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

  success: {
    background: "#22c55e"
  },

  error: {
    background: "#ef4444"
  },

  info: {
    background: "#3b82f6"
  }
};