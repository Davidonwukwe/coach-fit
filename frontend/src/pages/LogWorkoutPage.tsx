// src/pages/LogWorkoutPage.tsx
import React, { useEffect, useState } from "react";
import { createExercise, Exercise, fetchExercises } from "../api/exercise";
import {
  createWorkout,
  type Workout,
  type WorkoutSet,
  type WorkoutItem,
} from "../api/workout";

interface SetInput {
  reps: number;
  weight?: number;
  rpe: number;
}

interface ExerciseEntry {
  selectedExerciseId: string;
  customExerciseName: string;
  sets: SetInput[];
}

type CreateWorkoutPayload = Omit<
  Workout,
  "_id" | "userId" | "createdAt" | "updatedAt"
>;

const LogWorkoutPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [entries, setEntries] = useState<ExerciseEntry[]>([
    {
      selectedExerciseId: "",
      customExerciseName: "",
      sets: [{ reps: 8, weight: 0, rpe: 7 }],
    },
  ]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Load exercises on page mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchExercises();
        setExercises(data);
      } catch (err) {
        console.error("Failed to load exercises", err);
      }
    };
    loadExercises();
  }, []);

  // Helpers
  const addExerciseEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        selectedExerciseId: "",
        customExerciseName: "",
        sets: [{ reps: 8, weight: 0, rpe: 7 }],
      },
    ]);
  };

  const removeExerciseEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntryField = (
    index: number,
    field: "selectedExerciseId" | "customExerciseName",
    value: string
  ) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addSetToEntry = (entryIndex: number) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[entryIndex].sets.push({ reps: 8, weight: 0, rpe: 7 });
      return [...copy];
    });
  };

  const updateSetInEntry = (
    entryIndex: number,
    setIndex: number,
    field: keyof SetInput,
    value: number
  ) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[entryIndex].sets[setIndex] = {
        ...copy[entryIndex].sets[setIndex],
        [field]: value,
      };
      return copy;
    });
  };

  // Resolve chosen or new exercise
  const resolveExerciseForEntry = async (
    entry: ExerciseEntry
  ): Promise<Exercise> => {
    if (entry.selectedExerciseId) {
      const found = exercises.find((ex) => ex._id === entry.selectedExerciseId);
      if (!found) throw new Error("Selected exercise not found.");
      return found;
    }

    if (!entry.customExerciseName.trim()) {
      throw new Error("Please enter an exercise name.");
    }

    const newExercise = await createExercise(entry.customExerciseName.trim());
    setExercises((prev) => [...prev, newExercise]);
    return newExercise;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const resolvedExercises = await Promise.all(
        entries.map((entry) => resolveExerciseForEntry(entry))
      );

      const items: WorkoutItem[] = entries.map((entry, idx) => {
        const ex = resolvedExercises[idx];
        const mappedSets: WorkoutSet[] = entry.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight || 0,
          rpe: s.rpe || 0,
        }));

        return {
          exerciseId: ex._id,
          exerciseName: ex.name,
          sets: mappedSets,
        };
      });

      const payload: CreateWorkoutPayload = {
        date: new Date().toISOString(),
        notes: notes.trim() || undefined,
        items,
      };

      const saved = await createWorkout(payload);
      console.log("Saved workout:", saved);

      alert("Workout saved successfully!");

      // Reset
      setEntries([
        {
          selectedExerciseId: "",
          customExerciseName: "",
          sets: [{ reps: 8, weight: 0, rpe: 7 }],
        },
      ]);
      setNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to save workout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-main">
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Log a Workout
      </h1>

      <p style={{ color: "#6b7280", maxWidth: 550 }}>
        Add exercises, sets, weights, and RPE. Your logged workouts will appear
        in **History** and be used to generate your **Analytics**.
      </p>

      <div className="card" style={{ marginTop: "1.5rem", maxWidth: 900 }}>
        <form onSubmit={handleSubmit}>
          {entries.map((entry, idx) => {
            const isUsingCustom = !entry.selectedExerciseId;

            return (
              <div
                key={idx}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "1rem",
                  marginBottom: "1rem",
                  background: "#f9fafb",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    Exercise {idx + 1}
                  </h2>

                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExerciseEntry(idx)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Exercise dropdown */}
                <label style={{ fontSize: "0.9rem" }}>
                  Exercise
                  <select
                    value={entry.selectedExerciseId || "custom"}
                    onChange={(e) =>
                      updateEntryField(
                        idx,
                        "selectedExerciseId",
                        e.target.value === "custom" ? "" : e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "0.55rem",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      marginTop: "0.3rem",
                    }}
                  >
                    <option value="custom">➕ Add or type a new exercise</option>
                    {exercises.map((ex) => (
                      <option key={ex._id} value={ex._id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Custom name */}
                {isUsingCustom && (
                  <label style={{ display: "block", marginTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.9rem" }}>Exercise Name</span>
                    <input
                      value={entry.customExerciseName}
                      onChange={(e) =>
                        updateEntryField(
                          idx,
                          "customExerciseName",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Barbell Bench Press"
                      style={{
                        width: "100%",
                        padding: "0.55rem",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        marginTop: "0.3rem",
                      }}
                    />
                  </label>
                )}

                {/* Sets */}
                <h3
                  style={{
                    marginTop: "1rem",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  Sets
                </h3>

                {entry.sets.map((set, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.75rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {/* Reps */}
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>Reps</label>
                      <input
                        type="number"
                        min={1}
                        value={set.reps}
                        onChange={(e) =>
                          updateSetInEntry(idx, sIdx, "reps", +e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                        }}
                      />
                    </div>

                    {/* Weight */}
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>Weight (kg)</label>
                      <input
                        type="number"
                        min={0}
                        value={set.weight}
                        onChange={(e) =>
                          updateSetInEntry(idx, sIdx, "weight", +e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                        }}
                      />
                    </div>

                    {/* RPE */}
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>RPE</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={set.rpe}
                        onChange={(e) =>
                          updateSetInEntry(idx, sIdx, "rpe", +e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Add set */}
                <button
                  type="button"
                  onClick={() => addSetToEntry(idx)}
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.35rem 0.9rem",
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  + Add Set
                </button>
              </div>
            );
          })}

          {/* Add exercise block */}
          <button
            type="button"
            onClick={addExerciseEntry}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: 999,
              border: "1px dashed #9ca3af",
              background: "white",
              cursor: "pointer",
              marginTop: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            ➕ Add Exercise
          </button>

          {/* Notes */}
          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.9rem" }}>Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                minHeight: 80,
                padding: "0.6rem",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginTop: "0.3rem",
              }}
              placeholder="How did this workout feel?"
            />
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="primary-btn"
            style={{
              borderRadius: 999,
              padding: "0.6rem 1.4rem",
              fontSize: "1rem",
            }}
          >
            {saving ? "Saving..." : "Save Workout"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogWorkoutPage;
