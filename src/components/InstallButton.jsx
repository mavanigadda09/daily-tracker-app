import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log("✅ beforeinstallprompt fired");

      setDeferredPrompt(e);

      // 🔥 Smart delay (better UX)
      setTimeout(() => {
        // Show only once per day
        const lastShown = localStorage.getItem("install_prompt");

        if (!lastShown || Date.now() - lastShown > 86400000) {
          setVisible(true);
          localStorage.setItem("install_prompt", Date.now());
        }
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      alert("Install not available yet. Try again later.");
      return;
    }

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      console.log("🎉 User accepted install");
    } else {
      console.log("❌ User dismissed install");
    }

    setDeferredPrompt(null);
    setVisible(false);
  };

  // ✅ Don't show until ready
  if (!visible) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h3 style={{ margin: 0 }}>📲 Install App</h3>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Get a faster, app-like experience 🚀
        </p>

        <div style={styles.actions}>
          <button style={styles.installBtn} onClick={installApp}>
            Install
          </button>

          <button
            style={styles.cancelBtn}
            onClick={() => setVisible(false)}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: {
    position: "fixed",
    bottom: 20,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    zIndex: 9999
  },

  card: {
    width: 320,
    background: "#111827",
    color: "#fff",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    textAlign: "center"
  },

  actions: {
    display: "flex",
    gap: 10,
    marginTop: 15
  },

  installBtn: {
    flex: 1,
    padding: 10,
    background: "#22c55e",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  cancelBtn: {
    flex: 1,
    padding: 10,
    background: "#374151",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  }
};