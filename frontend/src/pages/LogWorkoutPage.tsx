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
  selectedExerciseId: string;   // existing exercise from dropdown
  customExerciseName: string;   // new exercise name typed by user
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

  // Load exercises from backend when page mounts
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

  // ---- helpers for manipulating entries/sets ----

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
      copy[entryIndex] = {
        ...copy[entryIndex],
        sets: [...copy[entryIndex].sets, { reps: 8, weight: 0, rpe: 7 }],
      };
      return copy;
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
      const setsCopy = [...copy[entryIndex].sets];
      setsCopy[setIndex] = { ...setsCopy[setIndex], [field]: value };
      copy[entryIndex] = { ...copy[entryIndex], sets: setsCopy };
      return copy;
    });
  };

  // Resolve one ExerciseEntry → Exercise (either existing or newly created)
  const resolveExerciseForEntry = async (
    entry: ExerciseEntry
  ): Promise<Exercise> => {
    if (entry.selectedExerciseId) {
      const found = exercises.find((ex) => ex._id === entry.selectedExerciseId);
      if (!found) {
        throw new Error("Selected exercise not found. Please choose again.");
      }
      return found;
    }

    // custom exercise path
    if (!entry.customExerciseName.trim()) {
      throw new Error("Please select an exercise or type a new one for each block.");
    }

    const newExercise = await createExercise(entry.customExerciseName.trim());

    // update local state so it appears in dropdown next time
    setExercises((prev) => [...prev, newExercise]);

    return newExercise;
  };

  // ---- submit handler ----
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (entries.length === 0) {
        alert("Please add at least one exercise.");
        setSaving(false);
        return;
      }

      // Resolve all exercises (existing or newly created)
      const resolvedExercises = await Promise.all(
        entries.map((entry) => resolveExerciseForEntry(entry))
      );

      // Build WorkoutItem[] from entries + resolved exercises
      const items: WorkoutItem[] = entries.map((entry, idx) => {
        const exercise = resolvedExercises[idx];

        const mappedSets: WorkoutSet[] = entry.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight || 0,
          rpe: s.rpe || 0,
        }));

        return {
          exerciseId: exercise._id,
          exerciseName: exercise.name,
          sets: mappedSets,
        };
      });

      const workoutPayload: CreateWorkoutPayload = {
        date: new Date().toISOString(),
        notes: notes.trim() || undefined,
        items,
      };

      const saved = await createWorkout(workoutPayload);
      console.log("Saved workout:", saved);

      alert(
        `Workout saved!\n\nExercises: ${items.length}\nTotal sets: ${items.reduce(
          (sum, it) => sum + it.sets.length,
          0
        )}`
      );

      // Reset form after saving
      setEntries([
        {
          selectedExerciseId: "",
          customExerciseName: "",
          sets: [{ reps: 8, weight: 0, rpe: 7 }],
        },
      ]);
      setNotes("");
    } catch (err: any) {
      console.error("Failed to save workout", err);
      alert(err.message || "Failed to save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Log Workout</h1>
      <p style={{ maxWidth: 520, marginTop: "0.5rem", color: "#555" }}>
        Add one or more exercises to this workout. Each exercise can have its
        own sets with reps, weight, and RPE.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 700, marginTop: "1rem" }}>
        {entries.map((entry, idx) => {
          const isUsingCustom = !entry.selectedExerciseId;

          return (
            <div
              key={idx}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1rem" }}>
                  Exercise {idx + 1}
                </h2>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExerciseEntry(idx)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#c00",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Exercise select */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label>
                  Exercise <br />
                  <select
                    value={entry.selectedExerciseId || "custom"}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "custom") {
                        updateEntryField(idx, "selectedExerciseId", "");
                      } else {
                        updateEntryField(idx, "selectedExerciseId", value);
                      }
                    }}
                    style={{ width: "100%", padding: "0.5rem" }}
                  >
                    <option value="custom">➕ Add or type a new exercise</option>
                    {exercises.map((ex) => (
                      <option key={ex._id} value={ex._id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Custom exercise name input */}
              {isUsingCustom && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <label>
                    Exercise name <br />
                    <input
                      type="text"
                      value={entry.customExerciseName}
                      onChange={(e) =>
                        updateEntryField(
                          idx,
                          "customExerciseName",
                          e.target.value
                        )
                      }
                      style={{ width: "100%", padding: "0.5rem" }}
                      placeholder="e.g. Barbell Bench Press"
                    />
                  </label>
                </div>
              )}

              {/* Sets for this exercise */}
              <h3 style={{ marginTop: "0.5rem", fontSize: "0.95rem" }}>Sets</h3>
              {entry.sets.map((set, setIndex) => (
                <div
                  key={setIndex}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div>
                    <label>
                      Reps
                      <input
                        type="number"
                        min={1}
                        value={set.reps}
                        onChange={(e) =>
                          updateSetInEntry(
                            idx,
                            setIndex,
                            "reps",
                            Number(e.target.value)
                          )
                        }
                        style={{ width: "100%", padding: "0.25rem" }}
                        required
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Weight (kg)
                      <input
                        type="number"
                        min={0}
                        value={set.weight}
                        onChange={(e) =>
                          updateSetInEntry(
                            idx,
                            setIndex,
                            "weight",
                            Number(e.target.value)
                          )
                        }
                        style={{ width: "100%", padding: "0.25rem" }}
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      RPE
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={set.rpe}
                        onChange={(e) =>
                          updateSetInEntry(
                            idx,
                            setIndex,
                            "rpe",
                            Number(e.target.value)
                          )
                        }
                        style={{ width: "100%", padding: "0.25rem" }}
                      />
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addSetToEntry(idx)}
                style={{ marginTop: "0.25rem", marginBottom: "0.25rem" }}
              >
                + Add another set
              </button>
            </div>
          );
        })}

        {/* Add new exercise block */}
        <button
          type="button"
          onClick={addExerciseEntry}
          style={{
            marginTop: "0.5rem",
            marginBottom: "1rem",
            display: "inline-block",
          }}
        >
          ➕ Add another exercise
        </button>

        {/* Notes */}
        <div style={{ marginBottom: "1rem", marginTop: "1rem" }}>
          <label>
            Notes (optional) <br />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", minHeight: "80px" }}
              placeholder="How did this workout feel?"
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Workout"}
        </button>
      </form>
    </div>
  );
};

export default LogWorkoutPage;