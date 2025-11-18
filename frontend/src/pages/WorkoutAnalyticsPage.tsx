// src/pages/WorkoutAnalyticsPage.tsx
import React, { useEffect, useState } from "react";
import { fetchWorkouts, type Workout } from "../api/workout";

const WorkoutAnalyticsPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWorkouts();
        setWorkouts(data);
      } catch (err) {
        console.error("Failed to load workouts", err);
        setError("Failed to load workouts for analytics.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ==== Derive analytics from workouts ====
  const totalWorkouts = workouts.length;

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const last7DaysWorkouts = workouts.filter(
    (w) => new Date(w.date) >= sevenDaysAgo
  );

  const totalWorkoutsLast7 = last7DaysWorkouts.length;

  const totalSetsLast7 = last7DaysWorkouts.reduce((sum, w) => {
    return (
      sum +
      w.items.reduce((inner, item) => inner + (item.sets?.length || 0), 0)
    );
  }, 0);

  // Top exercises (by how many times they appear across all workouts)
  const exerciseCountMap = new Map<string, number>();

  workouts.forEach((w) => {
    w.items.forEach((item) => {
      const name = item.exerciseName || "Exercise";
      exerciseCountMap.set(name, (exerciseCountMap.get(name) || 0) + 1);
    });
  });

  const topExercises = Array.from(exerciseCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Workout Analytics</h1>
      <p>
        High-level summary of your training based on the workouts you’ve logged
        in Coach-Fit.
      </p>

      {loading && <p>Loading analytics...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Key numbers */}
          <section
            style={{
              marginTop: "1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              maxWidth: "800px",
            }}
          >
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                background: "#fafafa",
              }}
            >
              <h3>Total Workouts</h3>
              <p style={{ fontSize: "1.8rem", margin: 0 }}>{totalWorkouts}</p>
              <small>All time</small>
            </div>

            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                background: "#fafafa",
              }}
            >
              <h3>Workouts (Last 7 Days)</h3>
              <p style={{ fontSize: "1.8rem", margin: 0 }}>
                {totalWorkoutsLast7}
              </p>
              <small>Past week</small>
            </div>

            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                background: "#fafafa",
              }}
            >
              <h3>Total Sets (Last 7 Days)</h3>
              <p style={{ fontSize: "1.8rem", margin: 0 }}>{totalSetsLast7}</p>
              <small>All exercises combined</small>
            </div>
          </section>

          {/* Top exercises */}
          <section style={{ marginTop: "2rem", maxWidth: "800px" }}>
            <h2>Your Most Logged Exercises</h2>
            {topExercises.length === 0 ? (
              <p>You haven’t logged enough data yet to show exercise trends.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, marginTop: "0.75rem" }}>
                {topExercises.map(([name, count]) => (
                  <li
                    key={name}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "0.5rem 0.75rem",
                      marginBottom: "0.5rem",
                      background: "#fdfdfd",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{name}</span>
                    <span style={{ fontSize: "0.9rem", color: "#555" }}>
                      {count} workout{count > 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default WorkoutAnalyticsPage;