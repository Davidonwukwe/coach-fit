// src/pages/WorkoutDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchWorkouts,
  updateWorkout,
  type Workout,
  type WorkoutItem,
  type WorkoutSet,
} from "../api/workout";

const WorkoutDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editing, setEditing] = useState<boolean>(false);
  const [draftItems, setDraftItems] = useState<WorkoutItem[]>([]);
  const [draftNotes, setDraftNotes] = useState<string>("");

  const [saving, setSaving] = useState<boolean>(false);

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
          // Initialize edit drafts from the loaded workout
          setDraftItems(found.items || []);
          setDraftNotes(found.notes || "");
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

  // ====== EDIT HELPERS ======

  const handleEditToggle = () => {
    if (!workout) return;

    if (!editing) {
      // Entering edit mode: sync drafts from current workout
      setDraftItems(workout.items || []);
      setDraftNotes(workout.notes || "");
      setEditing(true);
    } else {
      // If you ever want a "Cancel" behaviour, you could add it here.
      setEditing(false);
    }
  };

  const updateDraftSet = (
    itemIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: number | null
  ) => {
    setDraftItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[itemIndex] };
      const setsCopy = [...(item.sets || [])];

      const originalSet = setsCopy[setIndex] || { reps: 0, weight: 0, rpe: 0 };
      const newSet: WorkoutSet = { ...originalSet };

      if (field === "reps") {
        newSet.reps = value ?? 0;
      } else if (field === "weight") {
        // Make sure weight is never undefined (backend has required weight)
        newSet.weight = value ?? 0;
      } else if (field === "rpe") {
        newSet.rpe = value ?? 0;
      }

      setsCopy[setIndex] = newSet;
      item.sets = setsCopy;
      copy[itemIndex] = item;
      return copy;
    });
  };

  const handleSaveAll = async () => {
    if (!workout) return;

    try {
      setSaving(true);
      setError(null);

      // Build payload – we only send items + notes for this update
      const payload = {
        items: draftItems.map((item) => ({
          ...item,
          // Ensure sets always have numeric values
          sets: item.sets.map((s) => ({
            reps: s.reps ?? 0,
            weight: s.weight ?? 0,
            rpe: s.rpe ?? 0,
          })),
        })),
        notes: draftNotes.trim(),
      };

      const updated = await updateWorkout(workout._id, payload);

      // Update main workout and drafts from server response
      setWorkout(updated);
      setDraftItems(updated.items || []);
      setDraftNotes(updated.notes || "");
      setEditing(false);
    } catch (err) {
      console.error("Failed to update workout", err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
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

  // We display either the live workout data (view mode) or the draft data (edit mode)
  const itemsToShow = editing ? draftItems : workout.items;
  const notesToShow = editing ? draftNotes : workout.notes || "";

  // ====== STATS (always from current saved workout) ======
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
      <header
        style={{
          marginTop: "1rem",
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Workout Details</h1>
          <div style={{ color: "#555", fontSize: "0.95rem" }}>{dateLabel}</div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {!editing && (
            <button
              type="button"
              onClick={handleEditToggle}
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #007bff",
                background: "white",
                color: "#007bff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Edit sets & notes
            </button>
          )}

          {editing && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: "6px",
                border: "none",
                background: "#28a745",
                color: "white",
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Done editing sets"}
            </button>
          )}
        </div>
      </header>

      {/* High-level summary cards (unchanged) */}
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
          <div style={{ fontSize: "0.9rem", color: "#666" }}>Exercises</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#333",
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
          <div style={{ fontSize: "0.9rem", color: "#666" }}>Total Sets</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#333",
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
          <div style={{ fontSize: "0.9rem", color: "#666" }}>Total Reps</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#333",
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
          <div style={{ fontSize: "0.9rem", color: "#666" }}>
            Total Volume (kg·reps)
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#333",
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
          <div style={{ fontSize: "0.9rem", color: "#666" }}>Average RPE</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#333",
            }}
          >
            {avgRpe}
          </div>
        </div>
      </section>

      {/* Exercise-by-exercise breakdown */}
      <section>
        <h2>Exercise Breakdown</h2>

        {itemsToShow.length === 0 && (
          <p style={{ marginTop: "0.5rem" }}>
            No exercises logged for this workout.
          </p>
        )}

        {itemsToShow.map((item, idx) => {
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
                  <strong style={{ fontSize: "1rem", color: "#333" }}>
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
                  {item.sets.length} set
                  {item.sets.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Sets table */}
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                    color: "#333",
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

                      const isEditing = editing;

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

                          {/* Reps */}
                          <td
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                value={reps}
                                onChange={(e) =>
                                  updateDraftSet(
                                    idx,
                                    index,
                                    "reps",
                                    Number(e.target.value)
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "0.15rem",
                                  fontSize: "0.85rem",
                                }}
                              />
                            ) : (
                              reps
                            )}
                          </td>

                          {/* Weight */}
                          <td
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                value={weight}
                                onChange={(e) =>
                                  updateDraftSet(
                                    idx,
                                    index,
                                    "weight",
                                    Number(e.target.value)
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "0.15rem",
                                  fontSize: "0.85rem",
                                }}
                              />
                            ) : weight || "—"}
                          </td>

                          {/* RPE */}
                          <td
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: "0.3rem 0.25rem",
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                max={10}
                                value={set.rpe ?? 0}
                                onChange={(e) =>
                                  updateDraftSet(
                                    idx,
                                    index,
                                    "rpe",
                                    Number(e.target.value)
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "0.15rem",
                                  fontSize: "0.85rem",
                                }}
                              />
                            ) : (
                              set.rpe ?? "—"
                            )}
                          </td>

                          {/* Volume */}
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

      {/* NOTES – moved below exercise breakdown */}
      <section
        style={{
          marginTop: "2rem",
          maxWidth: "600px",
        }}
      >
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Notes</h2>

        {editing ? (
          <textarea
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "0.9rem",
            }}
            placeholder="How did this workout feel?"
          />
        ) : notesToShow ? (
          <p
            style={{
              marginTop: "0.25rem",
              fontSize: "0.9rem",
              color: "#444",
              whiteSpace: "pre-line",
            }}
          >
            {notesToShow}
          </p>
        ) : (
          <p style={{ fontSize: "0.9rem", color: "#888" }}>
            No notes added for this workout.
          </p>
        )}
      </section>

      {error && (
        <p style={{ marginTop: "1rem", color: "red" }}>{error}</p>
      )}
    </div>
  );
};

export default WorkoutDetailsPage;