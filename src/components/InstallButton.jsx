import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={installApp}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "12px 16px",
        borderRadius: "10px",
        background: "#0f172a",
        color: "white",
        border: "none",
        fontWeight: "bold",
        cursor: "pointer"
      }}
    >
      📲 Install App
    </button>
  );
}