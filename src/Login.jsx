import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Auto-login if user exists
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      onLogin(JSON.parse(savedUser));
      navigate("/");
    }
  }, []);

  // ✅ Email login / register
  const handleSubmit = async () => {
    if (!email || !password) return;

    if (isRegister && (!fullName || !username)) {
      setError("Please fill all required fields");
      return;
    }

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

        const user = userCredential.user;

        // 🔥 Save to Firestore
        await setDoc(doc(db, "users", user.uid), {
          fullName,
          username,
          email,
          createdAt: new Date()
        });

      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      const firebaseUser = userCredential.user;

      const userData = {
        name: fullName || firebaseUser.email.split("@")[0],
        email: firebaseUser.email
      };

      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);

      navigate("/");

    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  // ✅ Google login
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName: user.displayName,
        email: user.email,
        photo: user.photoURL,
        createdAt: new Date()
      }, { merge: true });

      const userData = {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      };

      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* 🔥 LOGO */}
        <img src="/logo.png" alt="logo" style={styles.logo} />

        <h1 style={styles.title}>
          {isRegister ? "Create Account" : "Welcome Back"}
        </h1>

        <p style={styles.subtitle}>
          {isRegister
            ? "Sign up to get started"
            : "Login to continue"}
        </p>

        {isRegister && (
          <>
            <input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
          </>
        )}

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

        {/* 🔥 Divider */}
        <div style={styles.divider}>— OR —</div>

        {/* 🔥 Google Login */}
        <button style={styles.googleBtn} onClick={handleGoogleLogin}>
          Continue with Google
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
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    background: "#020617"
  },

  card: {
    width: 360,
    background: "#0f172a",
    padding: 30,
    borderRadius: 16,
    border: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },

  logo: {
    width: 60,
    margin: "0 auto"
  },

  title: {
    textAlign: "center",
    fontSize: 24,
    color: "#fff"
  },

  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#94a3b8"
  },

  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #1e293b",
    background: "#020617",
    color: "#fff",
    outline: "none"
  },

  button: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#6366f1",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  googleBtn: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #1e293b",
    background: "#111827",
    color: "#fff",
    cursor: "pointer"
  },

  divider: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12
  },

  switch: {
    textAlign: "center",
    fontSize: 13,
    color: "#6366f1",
    cursor: "pointer"
  },

  error: {
    color: "#ef4444",
    fontSize: 13,
    textAlign: "center"
  }
};