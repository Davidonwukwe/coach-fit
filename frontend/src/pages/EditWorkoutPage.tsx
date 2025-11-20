// src/pages/EditWorkoutPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchWorkouts,
  updateWorkout,
  type Workout,
  type WorkoutItem,
  type WorkoutSet,
} from "../api/workout";

interface EditableSet {
  reps: number;
  weight: number;
  rpe: number;
}

interface EditableItem {
  exerciseId: string;
  name: string;
  muscleGroup?: string | null;
  sets: EditableSet[];
}

const EditWorkoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [originalWorkout, setOriginalWorkout] = useState<Workout | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // helpers
  const mapWorkoutToEditable = (w: Workout): EditableItem[] => {
    return w.items.map((item: WorkoutItem) => {
      const exObj = item.exerciseId as any;

      const name =
        item.exerciseName ||
        (exObj && typeof exObj === "object" && exObj.name) ||
        "Exercise";

      const muscleGroup =
        exObj && typeof exObj === "object" ? exObj.muscleGroup : null;

      const sets: EditableSet[] = (item.sets || []).map((s: WorkoutSet) => ({
        reps: s.reps ?? 0,
        weight: s.weight ?? 0,
        rpe: s.rpe ?? 7,
      }));

      return {
        exerciseId:
          typeof item.exerciseId === "string"
            ? (item.exerciseId as string)
            : (exObj && exObj._id) || "",
        name,
        muscleGroup,
        sets,
      };
    });
  };

  const formatDateForInput = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
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
          setOriginalWorkout(found);
          setItems(mapWorkoutToEditable(found));
          setNotes(found.notes || "");
          setDate(formatDateForInput(found.date));
        }
      } catch (err) {
        console.error("Failed to load workout for editing", err);
        setError("Failed to load workout.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // --- UI update helpers ---

  const updateSetField = (
    itemIndex: number,
    setIndex: number,
    field: keyof EditableSet,
    value: number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[itemIndex] };
      const setsCopy = [...item.sets];
      setsCopy[setIndex] = { ...setsCopy[setIndex], [field]: value };
      item.sets = setsCopy;
      copy[itemIndex] = item;
      return copy;
    });
  };

  const addSet = (itemIndex: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[itemIndex] };
      item.sets = [...item.sets, { reps: 8, weight: 0, rpe: 7 }];
      copy[itemIndex] = item;
      return copy;
    });
  };

  const removeSet = (itemIndex: number, setIndex: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[itemIndex] };
      const setsCopy = [...item.sets];
      setsCopy.splice(setIndex, 1);
      item.sets = setsCopy.length > 0 ? setsCopy : [{ reps: 8, weight: 0, rpe: 7 }];
      copy[itemIndex] = item;
      return copy;
    });
  };

  const removeExercise = (itemIndex: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy.splice(itemIndex, 1);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalWorkout) return;
    if (!id) return;

    if (items.length === 0) {
      alert("Workout must contain at least one exercise.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedItems = items.map((it) => ({
        exerciseId: it.exerciseId,
        exerciseName: it.name,
        sets: it.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          rpe: s.rpe,
        })),
      }));

      const payload = {
        date: date
          ? new Date(date).toISOString()
          : originalWorkout.date,
        notes: notes.trim() || undefined,
        items: updatedItems,
      };

      const updated = await updateWorkout(id, payload);
      console.log("Updated workout:", updated);

      navigate(`/workout/${id}`);
    } catch (err: any) {
      console.error("Failed to update workout", err);
      setError(err.message || "Failed to update workout.");
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

  if (error || !originalWorkout) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <Link to="/history" style={{ textDecoration: "none", color: "#007bff" }}>
          ← Back to workout history
        </Link>
        <p style={{ marginTop: "1rem", color: "red" }}>
          {error || "Workout not found."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <Link to={`/workout/${originalWorkout._id}`} style={{ textDecoration: "none", color: "#007bff" }}>
        ← Back to workout details
      </Link>

      <h1 style={{ marginTop: "1rem", marginBottom: "0.25rem" }}>Edit Workout</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
        {/* Date */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.9rem", color: "#555" }}>
            Date <br />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: "0.4rem 0.5rem", marginTop: "0.25rem" }}
            />
          </label>
        </div>

        {/* Exercises */}
        <h2 style={{ marginTop: "1.5rem" }}>Exercises & Sets</h2>

        {items.length === 0 && (
          <p style={{ marginTop: "0.5rem" }}>
            No exercises in this workout. (You must keep at least one exercise to save.)
          </p>
        )}

        {items.map((item, itemIndex) => (
          <div
            key={`${item.exerciseId}-${itemIndex}`}
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
                <strong style={{ fontSize: "1rem", color: "#222" }}>
                  {item.name}
                </strong>
                {item.muscleGroup && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.85rem",
                      color: "#777",
                    }}
                  >
                    • {item.muscleGroup}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeExercise(itemIndex)}
                style={{
                  fontSize: "0.8rem",
                  border: "none",
                  background: "transparent",
                  color: "#b91c1c",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Remove exercise
              </button>
            </div>

            {/* Sets table */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.sets.map((set, setIndex) => (
                    <tr key={setIndex}>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem 0.25rem",
                        }}
                      >
                        {setIndex + 1}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem 0.25rem",
                        }}
                      >
                        <input
                          type="number"
                          min={1}
                          value={set.reps}
                          onChange={(e) =>
                            updateSetField(
                              itemIndex,
                              setIndex,
                              "reps",
                              Number(e.target.value)
                            )
                          }
                          style={{ width: "70px", padding: "0.2rem" }}
                        />
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem 0.25rem",
                        }}
                      >
                        <input
                          type="number"
                          min={0}
                          value={set.weight}
                          onChange={(e) =>
                            updateSetField(
                              itemIndex,
                              setIndex,
                              "weight",
                              Number(e.target.value)
                            )
                          }
                          style={{ width: "80px", padding: "0.2rem" }}
                        />
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem 0.25rem",
                        }}
                      >
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={set.rpe}
                          onChange={(e) =>
                            updateSetField(
                              itemIndex,
                              setIndex,
                              "rpe",
                              Number(e.target.value)
                            )
                          }
                          style={{ width: "60px", padding: "0.2rem" }}
                        />
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "0.3rem 0.25rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => removeSet(itemIndex, setIndex)}
                          style={{
                            fontSize: "0.8rem",
                            border: "none",
                            background: "transparent",
                            color: "#b91c1c",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => addSet(itemIndex)}
              style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                borderRadius: "4px",
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              + Add set
            </button>
          </div>
        ))}

        {/* Notes */}
        <div style={{ marginTop: "1.5rem" }}>
          <label style={{ fontSize: "0.9rem", color: "#555" }}>
            Notes (optional) <br />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                minHeight: "80px",
                marginTop: "0.25rem",
              }}
              placeholder="How did this workout feel?"
            />
          </label>
        </div>

        {/* Footer buttons */}
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "6px",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#333",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>

        {error && (
          <p style={{ marginTop: "1rem", color: "red" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
};

export default EditWorkoutPage;