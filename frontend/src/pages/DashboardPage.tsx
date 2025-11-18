// src/pages/DashboardPage.tsx
import React from "react";
import { Link } from "react-router-dom";

const DashboardPage: React.FC = () => {
  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Coach-Fit Dashboard</h1>
      <p>Welcome back! Here you’ll see your workout stats and progress.</p>

      {/* NEW: Quick Action Button */}
      <div style={{ marginTop: "1.5rem" }}>
        <Link
          to="/log-workout"
          style={{
            padding: "0.75rem 1rem",
            background: "#007bff",
            color: "white",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ➕ Log a New Workout
        </Link>
      </div>

      <section style={{ marginTop: "2rem" }}>
        <h2>Coming Soon</h2>
        <ul>
          <li>Weekly training volume</li>
          <li>RPE and intensity trends</li>
          <li>Recommended next workouts</li>
        </ul>
      </section>
    </div>
  );
};

export default DashboardPage;