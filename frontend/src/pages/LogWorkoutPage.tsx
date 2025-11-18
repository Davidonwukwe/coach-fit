// src/pages/LogWorkoutPage.tsx
import React, { useEffect, useState } from "react";
import { createExercise, Exercise, fetchExercises } from "../api/exercise";

interface SetInput {
  reps: number;
  weight: number;
  rpe: number;
}

const LogWorkoutPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [customExerciseName, setCustomExerciseName] = useState<string>("");

  const [sets, setSets] = useState<SetInput[]>([
    { reps: 8, weight: 0, rpe: 7 },
  ]);

  // 🔁 Load exercises from backend when page mounts
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

  const addSet = () => {
    setSets((prev) => [...prev, { reps: 8, weight: 0, rpe: 7 }]);
  };

  const updateSet = (index: number, field: keyof SetInput, value: number) => {
    setSets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let exerciseToUse: Exercise | null = null;

      // Case 1: user selected an existing exercise from the dropdown
      if (selectedExerciseId) {
        const found = exercises.find((ex) => ex._id === selectedExerciseId);
        if (!found) {
          alert("Selected exercise not found. Please choose again.");
          return;
        }
        exerciseToUse = found;
      } else {
        // Case 2: user is adding a new exercise
        if (!customExerciseName.trim()) {
          alert("Please select an exercise or type a new one.");
          return;
        }

        // ✅ Create exercise in DB
        const newExercise = await createExercise(customExerciseName.trim());
        exerciseToUse = newExercise;

        // Optionally add it to local list and select it
        setExercises((prev) => [...prev, newExercise]);
        setSelectedExerciseId(newExercise._id);
      }

      if (!exerciseToUse) {
        alert("Something went wrong with the exercise selection.");
        return;
      }

      // 🧾 This is the payload we’ll later send to /api/workouts
      const workoutPayload = {
        exerciseId: exerciseToUse._id,
        exerciseName: exerciseToUse.name,
        sets,
        date: new Date().toISOString(),
      };

      console.log("Workout payload:", workoutPayload);
      alert(
        `Workout ready to send!\n\nExercise: ${exerciseToUse.name}\nSets: ${sets.length}`
      );

      // TODO (next step): call createWorkout(workoutPayload) once backend route is ready

      // reset form after "saving"
      setCustomExerciseName("");
      setSets([{ reps: 8, weight: 0, rpe: 7 }]);
    } catch (err) {
      console.error("Failed to submit workout", err);
      alert("Failed to save workout. Please try again.");
    }
  };

  const isUsingCustom = !selectedExerciseId;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Log Workout</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        {/* Exercise selection */}
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Exercise <br />
            <select
              value={selectedExerciseId || "custom"}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "custom") {
                  setSelectedExerciseId("");
                } else {
                  setSelectedExerciseId(value);
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
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Exercise name <br />
              <input
                type="text"
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                style={{ width: "100%", padding: "0.5rem" }}
                placeholder="e.g. Barbell Bench Press"
              />
            </label>
          </div>
        )}

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

        <button type="button" onClick={addSet} style={{ marginBottom: "1rem" }}>
          + Add another set
        </button>

        <br />

        <button type="submit">Save Workout</button>
      </form>
    </div>
  );
};

export default LogWorkoutPage;