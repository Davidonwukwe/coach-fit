// src/pages/AnalyticsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchWorkouts, type Workout } from "../api/workout";

const DAYS_WINDOW = 7;

function isWithinLastNDays(dateString: string, days: number): boolean {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

// Safely get a readable exercise name no matter how exerciseId is populated
function getExerciseName(item: Workout["items"][number]): string {
  if (item.exerciseName) return item.exerciseName;

  const id: any = item.exerciseId;
  if (id && typeof id === "object" && "name" in id) {
    return String(id.name);
  }

  return "Unknown exercise";
}

const AnalyticsPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWorkouts();
        setWorkouts(data);
      } catch (err) {
        console.error("Failed to load workouts for analytics", err);
        setError("Failed to load workouts.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    if (!workouts || workouts.length === 0) {
      return {
        totalWorkouts: 0,
        workoutsLast7: 0,
        totalSetsLast7: 0,
        topExercises: [] as { name: string; count: number }[],
      };
    }

    const totalWorkouts = workouts.length;

    const recent = workouts.filter((w) => isWithinLastNDays(w.date, DAYS_WINDOW));
    const workoutsLast7 = recent.length;

    const totalSetsLast7 = recent.reduce((sum, w) => {
      const setsInWorkout = w.items?.reduce(
        (inner, item) => inner + (item.sets?.length || 0),
        0
      );
      return sum + setsInWorkout;
    }, 0);

    // Count how often each exercise appears across ALL workouts
    const counts = new Map<string, number>();

    for (const w of workouts) {
      for (const item of w.items || []) {
        const name = getExerciseName(item);
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }

    const topExercises = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalWorkouts, workoutsLast7, totalSetsLast7, topExercises };
  }, [workouts]);

  const maxExerciseCount =
    stats.topExercises.length > 0
      ? Math.max(...stats.topExercises.map((e) => e.count))
      : 0;

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>Workout Analytics</h1>
        <p style={{ marginBottom: "1.5rem", color: "#aaa", maxWidth: 600 }}>
          High-level summary of your training based on the workouts you’ve
          logged in Coach-Fit.
        </p>

        {/* STAT CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: 12,
              background: "#111827",
              border: "1px solid #1f2937",
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              Total Workouts
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: 8 }}>
              {loading ? "…" : stats.totalWorkouts}
            </div>
          </div>

          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: 12,
              background: "#111827",
              border: "1px solid #1f2937",
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              Workouts (Last {DAYS_WINDOW} Days)
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: 8 }}>
              {loading ? "…" : stats.workoutsLast7}
            </div>
          </div>

          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: 12,
              background: "#111827",
              border: "1px solid #1f2937",
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              Total Sets (Last {DAYS_WINDOW} Days)
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: 8 }}>
              {loading ? "…" : stats.totalSetsLast7}
            </div>
          </div>
        </div>

        {/* ERRORS / EMPTY */}
        {error && (
          <p style={{ color: "salmon", marginTop: "1rem" }}>{error}</p>
        )}

        {/* MOST LOGGED EXERCISES */}
        <section style={{ marginTop: "2.5rem", maxWidth: 800 }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Your Most Logged Exercises</h2>

          {!loading && !error && stats.topExercises.length === 0 && (
            <p style={{ color: "#9ca3af" }}>
              Once you log a few workouts, we’ll show you which exercises you
             ’re doing the most.
            </p>
          )}

          {!loading && !error && stats.topExercises.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              {stats.topExercises.map((ex) => {
                const widthPercent =
                  maxExerciseCount > 0
                    ? (ex.count / maxExerciseCount) * 100
                    : 0;

                return (
                  <div key={ex.name} style={{ marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span>{ex.name}</span>
                      <span style={{ color: "#9ca3af" }}>
                        {ex.count} workout{ex.count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background: "#111827",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${widthPercent}%`,
                          borderRadius: 999,
                          background: "#4ade80", // green accent
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;