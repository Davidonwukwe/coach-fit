// src/pages/WorkoutHistoryPage.tsx
import React, { useEffect, useState } from "react";
import { fetchWorkouts, type Workout } from "../api/workout";

const WorkoutHistoryPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
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

    load();
  }, []);

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Workout History</h1>
      <p>Here are all the workouts you’ve logged in Coach-Fit.</p>

      {loading && <p>Loading workouts...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && workouts.length === 0 && (
        <p>You haven’t logged any workouts yet.</p>
      )}

      {!loading && !error && workouts.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gap: "0.75rem",
            maxWidth: "700px",
          }}
        >
          {workouts.map((w) => {
            const dateLabel = new Date(w.date).toLocaleDateString();
            const totalSets = w.items.reduce(
              (sum, item) => sum + (item.sets?.length || 0),
              0
            );
            const exercisesSummary =
              w.items
                .map((item) => item.exerciseName || "Exercise")
                .join(", ") || "Workout";

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

                <div style={{ fontSize: "0.9rem", color: "#333" }}>
                  Exercises: <strong>{exercisesSummary}</strong>
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
    </div>
  );
};

export default WorkoutHistoryPage;