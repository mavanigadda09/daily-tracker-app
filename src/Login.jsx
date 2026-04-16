import { useState } from "react";
import { auth, db, signInWithGoogle } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./context/NotificationContext";

const safeCall = (fn, ...args) => {
  if (typeof fn === "function") return fn(...args);
  else console.error("❌ Not a function:", fn);
};

export default function Login({ onLogin = () => {} }) {
  const navigate = useNavigate();
  const { showNotification } = useNotification() || {};

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      safeCall(showNotification, "Enter email & password", "error");
      return;
    }
    if (isRegister && (!fullName || !username)) {
      safeCall(showNotification, "Fill all fields", "error");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), { fullName, username, email });
        safeCall(showNotification, "Account created 🎉", "success");
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        safeCall(showNotification, "Login successful 🚀", "success");
      }

      const user = userCredential.user;
      const userData = {
        name: fullName || user.displayName || user.email.split("@")[0],
        email: user.email
      };

      safeCall(onLogin, userData);
      navigate("/", { replace: true });

    } catch (err) {
      const msg = err.message || "Login failed";
      setError(msg);
      safeCall(showNotification, msg, "error");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) throw new Error(result.error);

      const user = result.user;
      await setDoc(doc(db, "users", user.uid), { fullName: user.displayName, email: user.email }, { merge: true });

      const userData = { name: user.displayName, email: user.email };
      safeCall(onLogin, userData);
      safeCall(showNotification, "Google login successful 🎉", "success");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err.message || "Google login failed";
      setError(msg);
      safeCall(showNotification, msg, "error");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.left}>
          <img src="/phoenix.png" style={styles.logo} alt="Logo" />
          <h2 style={styles.brand}>Phoenix Tracker</h2>
          <p>Rise. Track. Conquer 🔥</p>
          <button onClick={() => setIsRegister(!isRegister)} style={styles.ghostBtn}>
            {isRegister ? "SIGN IN" : "REGISTER"}
          </button>
        </div>

        <div style={styles.right}>
          <h2 style={styles.title}>{isRegister ? "Create Account" : "Welcome Back"}</h2>
          {isRegister && (
            <>
              <input placeholder="Full Name" onChange={(e) => setFullName(e.target.value)} style={styles.input} />
              <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} style={styles.input} />
            </>
          )}
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          {error && <p style={styles.error}>{error}</p>}
          <button onClick={handleSubmit} style={styles.primaryBtn} disabled={loading}>
            {loading ? "Loading..." : isRegister ? "REGISTER" : "LOGIN"}
          </button>
          <button onClick={handleGoogleLogin} style={styles.googleBtn} disabled={loading}>
            Continue with Google
          </button>
          <p style={styles.switch} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Already have account? Login" : "Create new account"}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "radial-gradient(circle at top, #0f172a, #020617)" },
  wrapper: { width: "100%", maxWidth: 900, display: "flex", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 80px rgba(250,204,21,0.2)" },
  left: { flex: 1, background: "linear-gradient(135deg,#facc15,#f97316)", color: "#000", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 30, textAlign: "center" },
  logo: { width: 80, marginBottom: 10 },
  brand: { marginBottom: 10, fontWeight: "bold" },
  right: { flex: 1, background: "#020617", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", padding: 30, gap: 14 },
  title: { color: "#facc15" },
  input: { padding: 14, borderRadius: 12, border: "1px solid #334155", background: "#0f172a", color: "#fff" },
  primaryBtn: { padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#facc15,#f97316)", color: "#000", fontWeight: "bold", cursor: "pointer" },
  googleBtn: { padding: 14, borderRadius: 12, border: "1px solid #334155", background: "#0f172a", color: "#fff", cursor: "pointer" },
  ghostBtn: { marginTop: 20, padding: "12px 28px", border: "2px solid #000", background: "transparent", borderRadius: 30, cursor: "pointer" },
  switch: { textAlign: "center", color: "#facc15", cursor: "pointer" },
  error: { color: "#ef4444", fontSize: 12, textAlign: "center" }
};