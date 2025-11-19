// src/pages/WorkoutDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchWorkouts, type Workout, type WorkoutItem } from "../api/workout";

const WorkoutDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: format date nicely
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // Helper: get exercise name safely from item
  const getExerciseName = (item: WorkoutItem): string => {
    if (item.exerciseName) return item.exerciseName;

    const exObj = item.exerciseId as unknown as {
      _id?: string;
      name?: string;
      muscleGroup?: string;
    };

    if (exObj && typeof exObj === "object" && exObj.name) {
      return exObj.name;
    }

    if (typeof item.exerciseId === "string") {
      return item.exerciseId;
    }

    return "Exercise";
  };

  // Helper: get muscle group if populated
  const getMuscleGroup = (item: WorkoutItem): string | null => {
    const exObj = item.exerciseId as unknown as {
      _id?: string;
      name?: string;
      muscleGroup?: string;
    };

    if (exObj && typeof exObj === "object" && exObj.muscleGroup) {
      return exObj.muscleGroup;
    }

    return null;
  };

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("No workout id provided in URL.");
        setLoading(false);
        return;
      }

      try {
        const all = await fetchWorkouts();
        const found = all.find((w) => w._id === id);

        if (!found) {
          setError("Workout not found.");
        } else {
          setWorkout(found);
        }
      } catch (err) {
        console.error("Failed to load workout details", err);
        setError("Failed to load workout details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <p>Loading workout...</p>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <Link
          to="/history"
          style={{ textDecoration: "none", color: "#007bff" }}
        >
          ← Back to workout history
        </Link>
        <p style={{ marginTop: "1rem", color: "red" }}>
          {error || "Workout not found."}
        </p>
      </div>
    );
  }

  // ====== STATS ======
  const totalExercises = workout.items.length;

  const totalSets = workout.items.reduce(
    (sum, item) => sum + (item.sets?.length || 0),
    0
  );

  const { totalVolume, totalReps, rpeCount, rpeSum } = workout.items.reduce(
    (acc, item) => {
      item.sets.forEach((set) => {
        const weight = set.weight ?? 0;
        const reps = set.reps ?? 0;
        acc.totalVolume += weight * reps;
        acc.totalReps += reps;

        if (typeof set.rpe === "number") {
          acc.rpeSum += set.rpe;
          acc.rpeCount += 1;
        }
      });
      return acc;
    },
    { totalVolume: 0, totalReps: 0, rpeSum: 0, rpeCount: 0 }
  );

  const avgRpe = rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : "—";

  const dateLabel = formatDate(workout.date);

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Back link */}
      <Link
        to="/history"
        style={{ textDecoration: "none", color: "#007bff" }}
      >
        ← Back to workout history
      </Link>

      {/* Header */}
      <header style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>Workout Details</h1>
        <div style={{ color: "#bbbbbb", fontSize: "0.95rem" }}>{dateLabel}</div>
        {workout.notes && (
          <p style={{ marginTop: "0.5rem", color: "#dddddd" }}>
            <strong>Notes:</strong> {workout.notes}
          </p>
        )}
      </header>

      {/* High-level summary cards */}
      <section
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            minWidth: "180px",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "0.9rem", color: "#555" }}>Exercises</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#111",
            }}
          >
            {totalExercises}
          </div>
        </div>

        <div
          style={{
            minWidth: "180px",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "0.9rem", color: "#555" }}>Total Sets</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#111",
            }}
          >
            {totalSets}
          </div>
        </div>

        <div
          style={{
            minWidth: "180px",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "0.9rem", color: "#555" }}>Total Reps</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#111",
            }}
          >
            {totalReps}
          </div>
        </div>

        <div
          style={{
            minWidth: "180px",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "0.9rem", color: "#555" }}>
            Total Volume (kg·reps)
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#111",
            }}
          >
            {totalVolume.toFixed(0)}
          </div>
        </div>

        <div
          style={{
            minWidth: "180px",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "0.9rem", color: "#555" }}>Average RPE</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#111",
            }}
          >
            {avgRpe}
          </div>
        </div>
      </section>

      {/* Exercise-by-exercise breakdown */}
      <section>
        <h2 style={{ color: "#ffffff" }}>Exercise Breakdown</h2>

        {workout.items.length === 0 && (
          <p style={{ marginTop: "0.5rem" }}>
            No exercises logged for this workout.
          </p>
        )}

        {workout.items.map((item, idx) => {
          const exerciseName = getExerciseName(item);
          const muscleGroup = getMuscleGroup(item);

          return (
            <div
              key={idx}
              style={{
                marginTop: "1rem",
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
                  alignItems: "baseline",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <strong
                    style={{ fontSize: "1rem", color: "#111" }}
                  >
                    {exerciseName}
                  </strong>
                  {muscleGroup && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.85rem",
                        color: "#777",
                      }}
                    >
                      • {muscleGroup}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  {item.sets.length} set{item.sets.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Sets table */}
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                    color: "#111",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #ddd",
                          padding: "0.35rem 0.25rem",
                        }}
                      >
                        Set
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #ddd",
                          padding: "0.35rem 0.25rem",
                        }}
                      >
                        Reps
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #ddd",
                          padding: "0.35rem 0.25rem",
                        }}
                      >
                        Weight (kg)
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #ddd",
                          padding: "0.35rem 0.25rem",
                        }}
                      >
                        RPE
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #ddd",
                          padding: "0.35rem 0.25rem",
                        }}
                      >
                        Volume
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.sets.map((set, index) => {
                      const weight = set.weight ?? 0;
                      const reps = set.reps ?? 0;
                      const volume = weight * reps;

                      return (
                        <tr key={index}>
                          <td
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {reps}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {weight || "—"}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {set.rpe ?? "—"}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {volume ? volume.toFixed(0) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default WorkoutDetailsPage;