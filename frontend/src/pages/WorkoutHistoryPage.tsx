// src/pages/WorkoutHistoryPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Workout History</h1>
      <p>Here are all the workouts you’ve logged.</p>

      {loading && <p>Loading workouts...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && workouts.length === 0 && (
        <p>No workouts yet.</p>
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
            const dateLabel = formatDate(w.date);

            const totalSets = w.items.reduce(
              (sum, item) => sum + (item.sets?.length || 0),
              0
            );

            const exercisesSummary =
              w.items
                .map((item) => {
                  if (item.exerciseName) return item.exerciseName;

                  const exObj: any = item.exerciseId;
                  return exObj?.name || "Exercise";
                })
                .join(", ") || "Workout";

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
                  {/* Date + Summary */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                      color: "#555",
                    }}
                  >
                    <span>{dateLabel}</span>
                    <span>
                      {w.items.length} exercise
                      {w.items.length > 1 ? "s" : ""}, {totalSets} set
                      {totalSets > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Exercises */}
                  <div style={{ fontSize: "0.9rem", color: "#333" }}>
                    Exercises: <strong>{exercisesSummary}</strong>
                  </div>

                  {/* Notes */}
                  {w.notes && (
                    <div
                      style={{
                        marginTop: "0.4rem",
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
    </div>
  );
};

export default WorkoutHistoryPage;