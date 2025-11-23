import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWorkouts, type Workout } from "../api/workout";

const DashboardPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWorkouts();
        setWorkouts(data);
      } catch {
        setError("Failed to load workouts.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalSessions = workouts.length;

  return (
    <div className="app-main">
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Dashboard</h1>

      {/* Grid Layout */}
      <div className="dashboard-grid">

        {/* Card 1 */}
        <div className="card">
          <h2>Total Sessions per Week</h2>
          <div style={{ fontSize: "3rem", fontWeight: 700 }}>{totalSessions}</div>
          <div className="chart-placeholder"></div>
        </div>

        {/* Card 2 */}
        <div className="card">
          <h2>Preferred Exercise Types</h2>
          <div className="chart-placeholder"></div>
          <ul style={{ marginTop: "1rem", lineHeight: "1.8" }}>
            <li>Cardio</li>
            <li>Strength</li>
            <li>Yoga</li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="card">
          <h2>Progress Over Time</h2>
          <div className="chart-placeholder"></div>
        </div>

        {/* Card 4 */}
        <div className="card">
          <h2>Insights</h2>
          <p>Consider adding 2 cardio sessions per week.</p>
          <Link to="/analytics" className="insight-btn">
            View Recommendations
          </Link>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
