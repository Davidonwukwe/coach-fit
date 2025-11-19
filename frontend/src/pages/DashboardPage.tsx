// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWorkouts, type Workout } from "../api/workout";

const DashboardPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const data = await fetchWorkouts();
        setWorkouts(data);
      } catch (err) {
        console.error("Failed to load workouts", err);
        setError("Failed to load workouts.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, []);

  const hasWorkouts = !loading && !error && workouts.length > 0;

  const totalWorkouts = workouts.length;
  const lastWorkoutDate =
    hasWorkouts && workouts[0].date
      ? new Date(workouts[0].date).toLocaleDateString()
      : null;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Coach-Fit Dashboard</h1>
      <p>Welcome back! Here you’ll see your workout stats and quick links.</p>

      {/* Quick Actions */}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
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

        <Link
          to="/history"
          style={{
            padding: "0.75rem 1rem",
            background: "#28a745",
            color: "white",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          📘 View Workout History
        </Link>

        <Link
          to="/analytics"
          style={{
            padding: "0.75rem 1rem",
            background: "#6f42c1",
            color: "white",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          📊 View Analytics
        </Link>
      </div>

      {/* Stats */}
      <section
        style={{
          marginTop: "2rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* Total workouts */}
        <div
          style={{
            minWidth: "180px",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "0.9rem", color: "#666" }}>Total Workouts</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#666" }}>
            {totalWorkouts}
          </div>
        </div>

        {/* Last workout */}
        <div
          style={{
            minWidth: "180px",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "0.9rem", color: "#666" }}>
            Last Workout Date
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#666" }}>
            {lastWorkoutDate ?? "—"}
          </div>
        </div>
      </section>

      {/* Recent Workouts */}
      <section style={{ marginTop: "2rem" }}>
        <h2>Recent Workouts</h2>

        {loading && <p>Loading your workouts...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && workouts.length === 0 && (
          <p>No workouts logged yet.</p>
        )}

        {hasWorkouts && (
          <div
            style={{
              marginTop: "1rem",
              display: "grid",
              gap: "0.75rem",
              maxWidth: "600px",
            }}
          >
            {workouts.slice(0, 5).map((w) => {
              const dateLabel = new Date(w.date).toLocaleDateString();
              const firstItem = w.items[0];

              let mainExerciseName = "Workout";
              if (firstItem) {
                if (firstItem.exerciseName) {
                  mainExerciseName = firstItem.exerciseName;
                } else {
                  const exObj: any = firstItem.exerciseId;
                  if (exObj && typeof exObj === "object" && "name" in exObj) {
                    mainExerciseName = exObj.name;
                  }
                }
              }

              const totalSets = w.items.reduce(
                (sum, item) => sum + (item.sets?.length || 0),
                0
              );

              return (
                <Link
                  key={w._id}
                  to={`/workout/${w._id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      background: "#fafafa",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <strong style={{ color: "#555" }}>{dateLabel}</strong>
                      <span style={{ fontSize: "0.9rem", color: "#555" }}>
                        {w.items.length} exercise
                        {w.items.length > 1 ? "s" : ""}, {totalSets} set
                        {totalSets > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.95rem", color: "#333" }}>
                      Main exercise: <strong>{mainExerciseName}</strong>
                    </div>

                    {w.notes && (
                      <div
                        style={{
                          marginTop: "0.25rem",
                          fontSize: "0.85rem",
                          color: "#666",
                        }}
                      >
                        Notes: {w.notes}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;