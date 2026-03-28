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
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      onLogin();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered. Please login.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found. Please register.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      
      {/* LEFT SIDE */}
      <div style={styles.left}>
        <div>
          <h1 style={styles.brand}>🔥 Ignira OS</h1>
          <h2 style={styles.welcome}>Welcome Back!</h2>
          <p style={styles.desc}>
            Build discipline, track your life, and stay consistent.
          </p>

          <button style={styles.ghostBtn}>
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={styles.right}>
        <div style={styles.formCard}>

          <h2 style={styles.title}>
            {isRegister ? "Create Account" : "Login"}
          </h2>

          <p style={styles.subtitle}>
            Login to continue your journey
          </p>

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

          {error && <p style={styles.error}>{error}</p>}

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
              : "Don’t have an account? Sign up"}
          </p>

        </div>
      </div>

    </div>
  );
}

// ================= STYLES =================

const styles = {
  container: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden"
  },

  // LEFT PANEL
  left: {
    flex: 1,
    background: "linear-gradient(135deg,#0f766e,#059669)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 60
  },

  brand: {
    fontSize: 24,
    marginBottom: 10
  },

  welcome: {
    fontSize: 32,
    marginBottom: 10
  },

  desc: {
    color: "#d1fae5",
    maxWidth: 300,
    marginBottom: 30
  },

  ghostBtn: {
    padding: "10px 20px",
    borderRadius: 30,
    border: "1px solid #d1fae5",
    background: "transparent",
    color: "#fff",
    cursor: "pointer"
  },

  // RIGHT PANEL
  right: {
    flex: 1,
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  formCard: {
    width: "100%",
    maxWidth: 380,
    padding: 40
  },

  title: {
    fontSize: 28,
    marginBottom: 5,
    color: "#065f46"
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20
  },

  input: {
    width: "100%",
    padding: 14,
    marginBottom: 12,
    borderRadius: 30,
    border: "none",
    background: "#d1fae5"
  },

  button: {
    width: "100%",
    padding: 14,
    borderRadius: 30,
    border: "none",
    background: "#10b981",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  error: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 10
  },

  switch: {
    marginTop: 15,
    fontSize: 13,
    color: "#065f46",
    cursor: "pointer",
    textAlign: "center"
  }
};