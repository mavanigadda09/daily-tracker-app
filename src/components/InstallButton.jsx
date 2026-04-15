import { useEffect, useState } from "react";

export default function InstallButton() {
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [isInstallable, setIsInstallable] = useState(false);

useEffect(() => {
const handler = (e) => {
e.preventDefault();
console.log("✅ beforeinstallprompt fired");
setDeferredPrompt(e);
setIsInstallable(true);
};

```
window.addEventListener("beforeinstallprompt", handler);

return () => {
  window.removeEventListener("beforeinstallprompt", handler);
};
```

}, []);

const installApp = async () => {
if (!deferredPrompt) return;

```
deferredPrompt.prompt();

const choice = await deferredPrompt.userChoice;

if (choice.outcome === "accepted") {
  console.log("🎉 User accepted install");
} else {
  console.log("❌ User dismissed install");
}

setDeferredPrompt(null);
setIsInstallable(false);
```

};

// 🔴 IMPORTANT: Show debug button if not installable
if (!isInstallable) {
console.log("❌ App not installable yet");
return null;
}

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
cursor: "pointer",
zIndex: 9999
}}
>
📲 Install App </button>
);
}
