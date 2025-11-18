// src/pages/LogWorkoutPage.tsx
import React, { useState } from "react";

interface SetInput {
  reps: number;
  weight: number;
  rpe: number;
}

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api";

const LogWorkoutPage: React.FC = () => {
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState<SetInput[]>([
    { reps: 8, weight: 0, rpe: 7 },
  ]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSet = () => {
    setSets((prev) => [...prev, { reps: 8, weight: 0, rpe: 7 }]);
  };

  const updateSet = (index: number, field: keyof SetInput, value: number) => {
    const copy = [...sets];
    copy[index] = { ...copy[index], [field]: value };
    setSets(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("coachfit_token");
      if (!token) {
        setError("You need to log in again.");
        setSubmitting(false);
        return;
      }

      // 1) Create an Exercise for this name
      const exerciseRes = await fetch(`${API_BASE_URL}/exercises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: exerciseName.trim(),
        }),
      });

      if (!exerciseRes.ok) {
        const msg = await exerciseRes.text();
        throw new Error(
          `Failed to create exercise: ${exerciseRes.status} ${msg}`
        );
      }

      const exercise = await exerciseRes.json() as { _id: string };

      // 2) Create Workout that references that exercise
      const workoutRes = await fetch(`${API_BASE_URL}/workouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [
            {
              exerciseId: exercise._id,
              sets,
            },
          ],
          notes: notes.trim() || undefined,
        }),
      });

      if (!workoutRes.ok) {
        const msg = await workoutRes.text();
        throw new Error(
          `Failed to save workout: ${workoutRes.status} ${msg}`
        );
      }

      await workoutRes.json();

      alert("Workout saved to Coach-Fit ✅");

      // Reset form
      setExerciseName("");
      setSets([{ reps: 8, weight: 0, rpe: 7 }]);
      setNotes("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while saving your workout.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Log Workout</h1>
      <p>
        This logs a workout to your Coach-Fit backend using MongoDB (exercise +
        sets).
      </p>

      {error && (
        <p style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Exercise name <br />
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              style={{ width: "100%", padding: "0.5rem" }}
              placeholder="e.g. Barbell Bench Press"
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>
            Notes (optional) <br />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", minHeight: "60px" }}
              placeholder="How did this session feel?"
            />
          </label>
        </div>

        <h2>Sets</h2>
        {sets.map((set, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.5rem",
              marginBottom: "0.75rem",
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
                    updateSet(index, "reps", Number(e.target.value))
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
                    updateSet(index, "weight", Number(e.target.value))
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
                    updateSet(index, "rpe", Number(e.target.value))
                  }
                  style={{ width: "100%", padding: "0.25rem" }}
                />
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addSet}
          style={{ marginBottom: "1rem" }}
          disabled={submitting}
        >
          + Add another set
        </button>

        <br />

        <button type="submit" disabled={submitting || !exerciseName.trim()}>
          {submitting ? "Saving..." : "Save Workout"}
        </button>
      </form>
    </div>
  );
};

export default LogWorkoutPage;