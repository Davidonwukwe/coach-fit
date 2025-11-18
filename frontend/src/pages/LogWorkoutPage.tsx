// src/pages/LogWorkoutPage.tsx
import React, { useState } from "react";

interface SetInput {
  reps: number;
  weight: number;
  rpe: number;
}

const LogWorkoutPage: React.FC = () => {
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState<SetInput[]>([
    { reps: 8, weight: 0, rpe: 7 },
  ]);

  const addSet = () => {
    setSets([...sets, { reps: 8, weight: 0, rpe: 7 }]);
  };

  const updateSet = (index: number, field: keyof SetInput, value: number) => {
    const copy = [...sets];
    copy[index] = { ...copy[index], [field]: value };
    setSets(copy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 🔌 Later: send to backend /api/workouts
    console.log("Workout payload:", {
      exerciseName,
      sets,
    });
    alert("This will soon send your workout to the API 😎");
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Log Workout</h1>
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