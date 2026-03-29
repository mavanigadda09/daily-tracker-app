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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;

    setError("");
    setLoading(true);

    try {
      let userCredential;

      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      const firebaseUser = userCredential.user;

      const userData = {
        name: firebaseUser.email.split("@")[0],
        email: firebaseUser.email
      };

      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);

    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  // ✅ ENTER KEY SUPPORT
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          {isRegister ? "Create Account" : "Welcome Back"}
        </h1>

        <p style={styles.subtitle}>
          {isRegister
            ? "Sign up to get started"
            : "Login to continue"}
        </p>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : isRegister
            ? "Create Account"
            : "Login"}
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
            : "Don't have an account? Sign up"}
        </p>

      </div>

    </div>
  );
}

const styles = {
  container: {
  display: "flex",
  justifyContent: "center",   // ✅ CENTER HORIZONTALLY
  alignItems: "center",       // ✅ CENTER VERTICALLY
  height: "100vh",
  width: "100vw",
  background: "var(--bg)"
 },

  card: {
    width: 340,
    background: "var(--card)",
    padding: 30,
    borderRadius: 16,
    border: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },

  title: {
    textAlign: "center",
    fontSize: 24
  },

  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "var(--text-muted)"
  },

  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "#020617",
    color: "#fff",
    outline: "none"
  },

  button: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  switch: {
    textAlign: "center",
    fontSize: 13,
    color: "var(--accent)",
    cursor: "pointer"
  },

  error: {
    color: "#ef4444",
    fontSize: 13,
    textAlign: "center"
  }
};