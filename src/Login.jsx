import { useState, useEffect } from "react";
import { auth, db, signInWithGoogle } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
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

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      onLogin(JSON.parse(savedUser));
      navigate("/");
    }
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) return;

    if (isRegister && (!fullName || !username)) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let userCredential;

      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await setDoc(doc(db, "users", userCredential.user.uid), {
          fullName,
          username,
          email
        });
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      const user = userCredential.user;

      const userData = {
        name: fullName || user.email.split("@")[0],
        email: user.email
      };

      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);
      navigate("/");

    } catch {
      setError("Invalid credentials");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();

      await setDoc(doc(db, "users", user.uid), {
        fullName: user.displayName,
        email: user.email
      }, { merge: true });

      const userData = {
        name: user.displayName,
        email: user.email
      };

      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);
      navigate("/");
    } catch {
      setError("Google login failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.wrapper,
        transform: isRegister ? "translateX(-50%)" : "translateX(0)"
      }}>
        
        {/* LEFT PANEL */}
        <div style={styles.left}>
          <h2>Welcome Back!</h2>
          <p>To keep connected with us login with your info</p>
          <button onClick={() => setIsRegister(false)} style={styles.ghostBtn}>
            SIGN IN
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.right}>
          <h2>{isRegister ? "Create Account" : "Sign In"}</h2>

          {isRegister && (
            <>
              <input placeholder="Full Name" onChange={(e) => setFullName(e.target.value)} style={styles.input} />
              <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} style={styles.input} />
            </>
          )}

          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={styles.input} />

          {error && <p style={styles.error}>{error}</p>}

          <button onClick={handleSubmit} style={styles.primaryBtn}>
            {loading ? "Loading..." : isRegister ? "REGISTER" : "LOGIN"}
          </button>

          <button onClick={handleGoogleLogin} style={styles.googleBtn}>
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
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)"
  },

  wrapper: {
    width: 800,
    height: 500,
    display: "flex",
    borderRadius: 20,
    overflow: "hidden",
    transition: "0.5s ease",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)"
  },

  left: {
    flex: 1,
    background: "linear-gradient(135deg, #1b5e20, #66bb6a)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    textAlign: "center"
  },

  right: {
    flex: 1,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 40,
    gap: 12
  },

  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ccc"
  },

  primaryBtn: {
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#2e7d32",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  googleBtn: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer"
  },

  ghostBtn: {
    marginTop: 20,
    padding: "10px 20px",
    border: "1px solid #fff",
    background: "transparent",
    color: "#fff",
    borderRadius: 20,
    cursor: "pointer"
  },

  switch: {
    textAlign: "center",
    cursor: "pointer",
    color: "#2e7d32"
  },

  error: {
    color: "red",
    fontSize: 12
  }
};