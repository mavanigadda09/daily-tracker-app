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
      
      {/* LEFT PANEL */}
      <div style={styles.left}>
        <div>
          <div style={styles.logoCircle}>🌿</div>
          <h2 style={styles.brand}>Ignira OS</h2>

          <h1 style={styles.welcome}>Welcome Back!</h1>

          <p style={styles.desc}>
            To stay connected with us please login with your personal info
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.right}>
        <div style={styles.formCard}>

          <h2 style={styles.title}>welcome</h2>
          <p style={styles.subtitle}>
            Login to your account to continue
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

          <p style={styles.forgot}>Forgot your password?</p>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} onClick={handleSubmit}>
            {isRegister ? "Create Account" : "LOG IN"}
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
              : "Don't have an account? sign up"}
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
    height: "100vh",
    width: "100vw"
  },

  // LEFT SIDE
  left: {
    flex: 1,
    background: "linear-gradient(135deg,#166534,#15803d)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60
  },

  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#fff",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    marginBottom: 10
  },

  brand: {
    marginBottom: 20
  },

  welcome: {
    fontSize: 32,
    marginBottom: 10
  },

  desc: {
    maxWidth: 260,
    color: "#d1fae5"
  },

  // RIGHT SIDE
  right: {
    flex: 1,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 60,
    borderBottomLeftRadius: 60
  },

  formCard: {
    width: 320,
    textAlign: "center"
  },

  title: {
    fontSize: 28,
    color: "#166534",
    marginBottom: 5
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
    background: "#bbf7d0"
  },

  forgot: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 10
  },

  button: {
    width: "100%",
    padding: 14,
    borderRadius: 30,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 10
  },

  switch: {
    fontSize: 13,
    color: "#166534",
    cursor: "pointer"
  },

  error: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 10
  }
};