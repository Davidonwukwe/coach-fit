// src/pages/AnalyticsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchWorkouts, type Workout } from "../api/workout";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const DAYS_WINDOW = 7;
const CHART_DAYS = 20;

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

  const { stats, timeSeries } = useMemo(() => {
    if (!workouts || workouts.length === 0) {
      return {
        stats: {
          totalWorkouts: 0,
          workoutsLast7: 0,
          totalSetsLast7: 0,
          topExercises: [] as { name: string; count: number }[],
        },
        timeSeries: [] as { dateLabel: string; count: number }[],
      };
    }

    const totalWorkouts = workouts.length;

    const recent = workouts.filter((w) =>
      isWithinLastNDays(w.date, DAYS_WINDOW)
    );
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

    // ---- Time series for last CHART_DAYS days ----
    const byDay = new Map<string, number>();
    for (const w of workouts) {
      const d = new Date(w.date);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }

    const today = new Date();
    const series: { dateLabel: string; count: number }[] = [];

    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i
      );
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      series.push({
        dateLabel: label,
        count: byDay.get(key) || 0,
      });
    }

    return {
      stats: { totalWorkouts, workoutsLast7, totalSetsLast7, topExercises },
      timeSeries: series,
    };
  }, [workouts]);

  const maxExerciseCount =
    stats.topExercises.length > 0
      ? Math.max(...stats.topExercises.map((e) => e.count))
      : 0;

  return (
    <div className="app-main" style={{ maxWidth: 1100 }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Workout Analytics</h1>
      <p style={{ marginBottom: "1.5rem", color: "#6b7280", maxWidth: 600 }}>
        High-level summary of your training based on the workouts you’ve logged
        in Coach-Fit.
      </p>

      {/* STAT CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Total Workouts
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginTop: 8,
              color: "#111827",
            }}
          >
            {loading ? "…" : stats.totalWorkouts}
          </div>
        </div>

        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Workouts (Last {DAYS_WINDOW} Days)
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginTop: 8,
              color: "#111827",
            }}
          >
            {loading ? "…" : stats.workoutsLast7}
          </div>
        </div>

        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Total Sets (Last {DAYS_WINDOW} Days)
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginTop: 8,
              color: "#111827",
            }}
          >
            {loading ? "…" : stats.totalSetsLast7}
          </div>
        </div>
      </div>

      {/* ERRORS */}
      {error && (
        <p style={{ color: "salmon", marginTop: "0.5rem" }}>{error}</p>
      )}

      {/* WORKOUTS OVER TIME */}
      <section
        style={{
          marginTop: "1.5rem",
          marginBottom: "2rem",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          padding: "1.25rem 1.5rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1rem" }}>Workouts Over Time</h2>
        <div style={{ height: 280, marginTop: "0.75rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeries}
              margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                fontSize={12}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                fontSize={12}
                tickMargin={8}
              />
              <Tooltip
                cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* MOST LOGGED EXERCISES */}
      <section
        style={{
          marginBottom: "2rem",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          padding: "1.25rem 1.5rem 1.5rem",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>
          Your Most Logged Exercises
        </h2>

        {!loading && !error && stats.topExercises.length === 0 && (
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Once you log a few workouts, we’ll show you which exercises you’re
            doing the most.
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
                <div key={ex.name} style={{ marginBottom: "0.9rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span>{ex.name}</span>
                    <span style={{ color: "#6b7280" }}>
                      {ex.count} workout{ex.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: "#e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${widthPercent}%`,
                        borderRadius: 999,
                        background: "#22c55e",
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
  );
};

export default AnalyticsPage;