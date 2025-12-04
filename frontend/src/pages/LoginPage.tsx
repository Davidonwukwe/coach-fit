// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

// --- Styles ---
const styles = {
  pageContainer: {
    // FIX 1: Subtract header height (~80px) and padding to prevent scrolling
    minHeight: "calc(100vh - 120px)", 
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    padding: "1rem",
    // FIX 2: Removed background color so it blends with the parent container
    backgroundColor: "transparent", 
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "2.5rem",
    borderRadius: "12px",
    // Stronger shadow since we are now white-on-white
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    width: "100%",
    maxWidth: "400px",
    border: "1px solid #e5e7eb",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: "2rem",
    color: "#111827",
  },
  inputGroup: {
    marginBottom: "1.25rem",
  },
  label: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "1rem",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "99px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "1rem",
    transition: "opacity 0.2s",
  },
  errorMessage: {
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    padding: "0.75rem",
    borderRadius: "6px",
    fontSize: "0.875rem",
    marginBottom: "1.25rem",
    border: "1px solid #fecaca",
    textAlign: "center" as const,
  },
  footerText: {
    textAlign: "center" as const,
    marginTop: "1.5rem",
    color: "#6b7280",
    fontSize: "0.9rem",
  },
  link: {
    color: "#2563eb",
    fontWeight: 600,
    textDecoration: "none",
  },
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginWithResponse } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      loginWithResponse(data);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        
        <form onSubmit={handleSubmit}>
          {error && <div style={styles.errorMessage}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;