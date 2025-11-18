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

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Coach-Fit Dashboard</h1>
      <p>Welcome back! Here you’ll see your workout stats and progress.</p>

      {/* Quick Action Button */}
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

      {/* Recent Workouts */}
      <section style={{ marginTop: "2rem" }}>
        <h2>Recent Workouts</h2>

        {loading && <p>Loading your workouts...</p>}

        {error && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
        )}

        {!loading && !error && workouts.length === 0 && (
          <p style={{ marginTop: "0.5rem" }}>
            You haven’t logged any workouts yet. Start by logging your first
            session!
          </p>
        )}

        {!loading && !error && workouts.length > 0 && (
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

              // 🔍 Safely derive the main exercise name
              let mainExerciseName = "Workout";
              if (firstItem) {
                if (firstItem.exerciseName) {
                  mainExerciseName = firstItem.exerciseName;
                } else {
                  const exId: any = firstItem.exerciseId;
                  if (exId && typeof exId === "object" && "name" in exId) {
                    // Populated Mongoose document: { _id, name, muscleGroup }
                    mainExerciseName = exId.name;
                  } else if (typeof exId === "string") {
                    // Fallback: raw string id
                    mainExerciseName = exId;
                  }
                }
              }

              const totalSets = w.items.reduce(
                (sum, item) => sum + (item.sets?.length || 0),
                0
              );

              return (
                <div
                  key={w._id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <strong>{dateLabel}</strong>
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
              );
            })}
          </div>
        )}
      </section>

      {/* Coming Soon */}
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