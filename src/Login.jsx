import { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) return;

    setError("");

    try {
      if (isRegister) {
        // 📝 REGISTER
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // 🔐 LOGIN
        await signInWithEmailAndPassword(auth, email, password);
      }

      onLogin();
    } catch (err) {
      console.log(err);

      // 🔥 SMART ERROR MESSAGES
      if (err.code === "auth/email-already-in-use") {
        setError("⚠️ Email already registered. Please login.");
      } else if (err.code === "auth/user-not-found") {
        setError("❌ No account found. Please register.");
      } else if (err.code === "auth/wrong-password") {
        setError("❌ Incorrect password.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={{ color: "#fff" }}>
          {isRegister ? "📝 Register" : "🔐 Login"}
        </h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {/* ❗ ERROR MESSAGE */}
        {error && (
          <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>
        )}

        <button style={styles.button} onClick={handleSubmit}>
          {isRegister ? "Create Account" : "Login"}
        </button>

        <p
          style={styles.switch}
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
        >
          {isRegister
            ? "Already have an account? Login"
            : "New user? Register"}
        </p>

      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617"
  },
  card: {
    padding: 30,
    borderRadius: 16,
    background: "#0f172a",
    border: "1px solid #1e293b",
    textAlign: "center"
  },
  input: {
    width: 250,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff"
  },
  button: {
    padding: "10px 16px",
    borderRadius: 8,
    background: "#6366f1",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    width: "100%"
  },
  switch: {
    marginTop: 10,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 14
  }
};