// src/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// --- Styles ---
const styles = {
  // Main wrapper
  pageContainer: {
    // FIX 1: Subtract navbar height (~80px) to prevent unnecessary scrolling
    minHeight: "calc(100vh - 80px)", 
    display: "flex",
    flexDirection: "column" as const,
    // FIX 2: Set to transparent so it blends with the global body background
    backgroundColor: "transparent", 
  },
  // 1. Hero Section
  heroSection: {
    textAlign: "center" as const,
    padding: "6rem 2rem 4rem",
    maxWidth: "800px",
    margin: "0 auto",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: 800,
    lineHeight: 1.1,
    color: "#111827",
    marginBottom: "1.5rem",
    letterSpacing: "-0.02em",
  },
  heroSubtitle: {
    fontSize: "1.25rem",
    color: "#6b7280",
    lineHeight: 1.6,
    marginBottom: "2.5rem",
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  primaryBtn: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "0.8rem 2rem",
    borderRadius: "99px",
    fontSize: "1rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "transform 0.1s",
    border: "1px solid #000",
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    color: "#374151",
    padding: "0.8rem 2rem",
    borderRadius: "99px",
    fontSize: "1rem",
    fontWeight: 600,
    textDecoration: "none",
    border: "1px solid #d1d5db",
    transition: "background 0.2s",
  },
  // 2. Features Grid
  featuresSection: {
    // This gray background will create a nice visual break
    // It will sit inside the transparent container
    backgroundColor: "#f9fafb", 
    padding: "4rem 2rem",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
  },
  featuresContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2rem",
  },
  featureCard: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  featureIcon: {
    fontSize: "2rem",
    marginBottom: "1rem",
    display: "block",
  },
  featureTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "0.5rem",
  },
  featureText: {
    color: "#6b7280",
    lineHeight: 1.5,
    fontSize: "0.95rem",
  },
  // 3. Footer
  footer: {
    textAlign: "center" as const,
    padding: "2rem",
    color: "#9ca3af",
    fontSize: "0.85rem",
  },
};

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={styles.pageContainer}>
      {/* --- HERO --- */}
      <section style={styles.heroSection}>
        <h1 style={styles.heroTitle}>
          Master your strength, <br />
          <span style={{ color: "#3b82f6" }}>data-driven.</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Stop guessing. Track your lifts, analyze your trends, and receive
          progressive overload recommendations to reach your peak potential.
        </p>

        <div style={styles.buttonGroup}>
          {user ? (
            <Link to="/dashboard" style={styles.primaryBtn}>
              Go to Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link to="/register" style={styles.primaryBtn}>
                Get Started Free
              </Link>
              <Link to="/login" style={styles.secondaryBtn}>
                I have an account
              </Link>
            </>
          )}
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresContainer}>
          {/* Feature 1 */}
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>📝</span>
            <h3 style={styles.featureTitle}>Log Workouts</h3>
            <p style={styles.featureText}>
              Easily record sets, reps, weight, and RPE with our clean, 
              distraction-free interface designed for the gym.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>📈</span>
            <h3 style={styles.featureTitle}>Visualize Progress</h3>
            <p style={styles.featureText}>
              See your strength gains over time with automated charts. 
              Identify plateaus before they happen.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🔥</span>
            <h3 style={styles.featureTitle}>Progressive Overload</h3>
            <p style={styles.featureText}>
              Coach-Fit helps you calculate your next move, ensuring you
              are always pushing harder than last time.
            </p>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer style={styles.footer}>
        © {new Date().getFullYear()} Coach-Fit. Built for strength.
      </footer>
    </div>
  );
};

export default HomePage;