// src/pages/LogWorkoutPage.tsx
import React, { useEffect, useState } from "react";
import { createExercise, Exercise, fetchExercises } from "../api/exercise";
import {
  createWorkout,
  type Workout,
  type WorkoutSet,
  type WorkoutItem,
} from "../api/workout";

// --- Types ---
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

// --- Styles ---
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    paddingBottom: "4rem",
  },
  headerTitle: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
    fontWeight: 700,
  },
  headerSubtitle: {
    color: "#6b7280",
    marginBottom: "2rem",
    lineHeight: 1.5,
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
    padding: "2rem",
  },
  exerciseBlock: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  exerciseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.4rem",
  },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "0.6rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "0.95rem",
  },
  select: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "0.6rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "0.95rem",
    backgroundColor: "#fff",
  },
  // UPDATED: Added a 4th column (40px) for the delete button
  setsHeaderGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 40px",
    gap: "1rem",
    marginBottom: "0.5rem",
    width: "100%",
  },
  // UPDATED: Added a 4th column (40px) and center alignment
  setsInputGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 40px",
    gap: "1rem",
    marginBottom: "0.75rem",
    width: "100%",
    alignItems: "center",
  },
  columnHeader: {
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    color: "#6b7280",
  },
  secondaryBtn: {
    marginTop: "0.5rem",
    padding: "0.5rem 1rem",
    borderRadius: "99px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#374151",
    transition: "background 0.2s",
  },
  primaryBtn: {
    borderRadius: "99px",
    padding: "0.75rem 2rem",
    fontSize: "1rem",
    fontWeight: 600,
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  removeBtn: {
    border: "none",
    background: "transparent",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  // NEW: Style for the X button next to a set
  deleteSetBtn: {
    border: "none",
    background: "transparent",
    color: "#d1d5db", // Light gray by default
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "color 0.2s",
  },
};

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

  // --- Helpers ---
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

  // FIX: Completely immutable update to prevent double-adding in Strict Mode
  const addSetToEntry = (entryIndex: number) => {
    setEntries((prev) => {
      const copy = [...prev];
      const targetEntry = { ...copy[entryIndex] };
      // Create a fresh array for sets
      targetEntry.sets = [
        ...targetEntry.sets,
        { reps: 8, weight: 0, rpe: 7 }
      ];
      copy[entryIndex] = targetEntry;
      return copy;
    });
  };

  // NEW: Delete specific set
  const removeSetFromEntry = (entryIndex: number, setIndex: number) => {
    setEntries((prev) => {
      const copy = [...prev];
      const targetEntry = { ...copy[entryIndex] };
      // Filter out the specific set
      targetEntry.sets = targetEntry.sets.filter((_, i) => i !== setIndex);
      copy[entryIndex] = targetEntry;
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
      // Deep copy the specific set we are modifying
      const targetEntry = { ...copy[entryIndex] };
      const targetSets = [...targetEntry.sets];
      targetSets[setIndex] = {
        ...targetSets[setIndex],
        [field]: value,
      };
      targetEntry.sets = targetSets;
      copy[entryIndex] = targetEntry;
      return copy;
    });
  };

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
      await createWorkout(payload);
      alert("Workout saved successfully!");
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
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>Log a Workout</h1>
      <p style={styles.headerSubtitle}>
        Add exercises, sets, weights, and RPE. Your logged workouts will appear
        in <strong>History</strong> and be used to generate your{" "}
        <strong>Analytics</strong>.
      </p>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          {entries.map((entry, idx) => {
            const isUsingCustom = !entry.selectedExerciseId;

            return (
              <div key={idx} style={styles.exerciseBlock}>
                {/* Exercise Header */}
                <div style={styles.exerciseHeader}>
                  <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                    Exercise {idx + 1}
                  </h2>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExerciseEntry(idx)}
                      style={styles.removeBtn}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Exercise Selection */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={styles.label}>Exercise Name</label>
                  <select
                    value={entry.selectedExerciseId || "custom"}
                    onChange={(e) =>
                      updateEntryField(
                        idx,
                        "selectedExerciseId",
                        e.target.value === "custom" ? "" : e.target.value
                      )
                    }
                    style={styles.select}
                  >
                    <option value="custom">
                      ➕ Add or type a new exercise
                    </option>
                    {exercises.map((ex) => (
                      <option key={ex._id} value={ex._id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>

                  {isUsingCustom && (
                    <div style={{ marginTop: "0.75rem" }}>
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
                        style={styles.input}
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* SETS SECTION */}
                <div>
                  {/* Table Headers */}
                  <div style={styles.setsHeaderGrid}>
                    <div style={styles.columnHeader}>Reps</div>
                    <div style={styles.columnHeader}>Weight (kg)</div>
                    <div style={styles.columnHeader}>RPE</div>
                    <div></div> {/* Empty column for delete button alignment */}
                  </div>

                  {/* Sets Rows */}
                  {entry.sets.map((set, sIdx) => (
                    <div key={sIdx} style={styles.setsInputGrid}>
                      {/* Reps Input */}
                      <input
                        type="number"
                        min={1}
                        value={set.reps}
                        onChange={(e) =>
                          updateSetInEntry(idx, sIdx, "reps", +e.target.value)
                        }
                        style={styles.input}
                      />

                      {/* Weight Input */}
                      <input
                        type="number"
                        min={0}
                        value={set.weight}
                        onChange={(e) =>
                          updateSetInEntry(
                            idx,
                            sIdx,
                            "weight",
                            +e.target.value
                          )
                        }
                        style={styles.input}
                      />

                      {/* RPE Input */}
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={set.rpe}
                        onChange={(e) =>
                          updateSetInEntry(idx, sIdx, "rpe", +e.target.value)
                        }
                        style={styles.input}
                      />

                      {/* Delete Set Button */}
                      {entry.sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSetFromEntry(idx, sIdx)}
                          style={styles.deleteSetBtn}
                          title="Remove set"
                          onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#d1d5db"}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addSetToEntry(idx)}
                    style={styles.secondaryBtn}
                  >
                    + Add Set
                  </button>
                </div>
              </div>
            );
          })}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              marginTop: "2rem",
            }}
          >
            <button
              type="button"
              onClick={addExerciseEntry}
              style={{
                ...styles.secondaryBtn,
                alignSelf: "start",
                marginTop: 0,
                borderStyle: "dashed",
              }}
            >
              ➕ Add Another Exercise
            </button>

            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
              <label style={styles.label}>Workout Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ ...styles.input, minHeight: "100px", resize: "vertical" }}
                placeholder="How did this workout feel?"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.primaryBtn,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Workout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogWorkoutPage;