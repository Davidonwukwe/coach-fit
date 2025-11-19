// src/pages/WorkoutDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  fetchWorkouts,
  deleteWorkout,
  type Workout,
  type WorkoutItem,
} from "../api/workout";

const WorkoutDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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

  const handleDelete = async () => {
    if (!workout) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this workout? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteWorkout(workout._id);
      alert("Workout deleted.");
      navigate("/history");
    } catch (err) {
      console.error("Failed to delete workout", err);
      alert("Failed to delete workout. Please try again.");
    }
  };

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <Link
          to="/history"
          style={{ textDecoration: "none", color: "#007bff" }}
        >
          ← Back to workout history
        </Link>

        <button
          onClick={handleDelete}
          style={{
            padding: "0.5rem 0.9rem",
            background: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Delete workout
        </button>
      </div>

      {/* Header */}
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ marginBottom: "0.25rem", color: "#f5f5f5" }}>
          Workout Details
        </h1>
        <div style={{ color: "#cccccc", fontSize: "0.95rem" }}>
          {dateLabel}
        </div>
        {workout.notes && (
          <p style={{ marginTop: "0.5rem", color: "#dddddd" }}>
            <strong>Notes:</strong> {workout.notes}
          </p>
        )}
      </header>

      {/* Summary cards */}
      <section
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Exercises", value: totalExercises },
          { label: "Total Sets", value: totalSets },
          { label: "Total Reps", value: totalReps },
          { label: "Total Volume (kg·reps)", value: totalVolume.toFixed(0) },
          { label: "Average RPE", value: avgRpe },
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              minWidth: "180px",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid #333",
              background: "#111319",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "#aaaaaa" }}>
              {card.label}
            </div>
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#f5f5f5",
                marginTop: "0.25rem",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </section>

      {/* Exercise breakdown */}
      <section>
        <h2 style={{ color: "#f5f5f5" }}>Exercise Breakdown</h2>

        {workout.items.length === 0 && (
          <p style={{ marginTop: "0.5rem", color: "#cccccc" }}>
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
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                background: "#111319",
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
                    style={{ fontSize: "1rem", color: "#f5f5f5" }}
                  >
                    {exerciseName}
                  </strong>
                  {muscleGroup && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.85rem",
                        color: "#bbbbbb",
                      }}
                    >
                      • {muscleGroup}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.85rem", color: "#bbbbbb" }}>
                  {item.sets.length} set{item.sets.length > 1 ? "s" : ""}
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                    color: "#e5e5e5",
                  }}
                >
                  <thead>
                    <tr>
                      {["Set", "Reps", "Weight (kg)", "RPE", "Volume"].map(
                        (label) => (
                          <th
                            key={label}
                            style={{
                              textAlign: "left",
                              borderBottom: "1px solid #333",
                              padding: "0.35rem 0.25rem",
                              fontWeight: 500,
                              color: "#bbbbbb",
                            }}
                          >
                            {label}
                          </th>
                        )
                      )}
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
                              borderBottom: "1px solid #222",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #222",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {reps}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #222",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {weight || "—"}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #222",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {set.rpe ?? "—"}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #222",
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