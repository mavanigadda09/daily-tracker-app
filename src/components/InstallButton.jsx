import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);

      // Smart delay: Show custom prompt after 3 seconds if not shown in last 24h
      setTimeout(() => {
        const lastShown = localStorage.getItem("install_prompt_timestamp");
        const now = Date.now();
        const ONE_DAY = 86400000;

        if (!lastShown || now - Number(lastShown) > ONE_DAY) {
          setVisible(true);
          localStorage.setItem("install_prompt_timestamp", now.toString());
        }
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also hide if already installed
    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("🎉 User accepted install");
    }
    
    setDeferredPrompt(null);
    setVisible(false);
  };

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
          <button style={styles.cancelBtn} onClick={() => setVisible(false)}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { position: "fixed", bottom: 20, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 9999 },
  card: { width: 320, background: "#111827", color: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", textAlign: "center" },
  actions: { display: "flex", gap: 10, marginTop: 15 },
  installBtn: { flex: 1, padding: 10, background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: "bold" },
  cancelBtn: { flex: 1, padding: 10, background: "#374151", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" }
};