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
const LOAD_WINDOW_DAYS = 30;
const CONSISTENCY_WEEKS = 8;

interface ConsistencyInfo {
  score: number | null; // 0–100 or null if not enough data
  label: string;
  avgPerWeek: number;
  weeks: number;
  trendLabel: string;
  projectedNextWeek: number | null;
}

// Helper: is date within last N days
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

// Map raw muscleGroup strings into a few buckets
function mapMuscleToBucket(raw: string): string {
  const lower = raw.toLowerCase();

  if (
    lower.includes("chest") ||
    lower.includes("shoulder") ||
    lower.includes("back") ||
    lower.includes("arm") ||
    lower.includes("upper")
  ) {
    return "Upper Body";
  }

  if (
    lower.includes("leg") ||
    lower.includes("glute") ||
    lower.includes("lower")
  ) {
    return "Lower Body";
  }

  if (lower.includes("core") || lower.includes("abs")) {
    return "Core";
  }

  if (lower.includes("cardio") || lower.includes("aerobic")) {
    return "Cardio";
  }

  return "Other";
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

  const {
    stats,
    timeSeries,
    trainingLoadSeries,
    muscleBalance,
    consistency,
    recoveryFlag,
    coachSuggestion,
  } = useMemo(() => {
    const emptyConsistency: ConsistencyInfo = {
      score: null,
      label: "Not enough data yet",
      avgPerWeek: 0,
      weeks: 0,
      trendLabel: "No trend yet",
      projectedNextWeek: null,
    };

    let coachSuggestion = "";

    if (!workouts || workouts.length === 0) {
      coachSuggestion =
        "Coach-Fit Suggests: Log a few workouts so I can analyze your training load, balance, and consistency.";
      return {
        stats: {
          totalWorkouts: 0,
          workoutsLast7: 0,
          totalSetsLast7: 0,
          topExercises: [] as { name: string; count: number }[],
        },
        timeSeries: [] as { dateLabel: string; count: number }[],
        trainingLoadSeries: [] as { dateLabel: string; load: number }[],
        muscleBalance: [] as { group: string; sets: number }[],
        consistency: emptyConsistency,
        recoveryFlag: "Not enough data yet",
        coachSuggestion,
      };
    }

    const totalWorkouts = workouts.length;

    // --- basic 7-day stats ---
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

    // --- top exercises across all time ---
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

    // --- workouts per day (for last CHART_DAYS days) ---
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

    // --- training load & muscle balance for last 30 days ---
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LOAD_WINDOW_DAYS);

    const loadByDay = new Map<string, number>();
    const muscleMap = new Map<string, number>();

    for (const w of workouts) {
      const d = new Date(w.date);
      const dayKey = d.toISOString().slice(0, 10);

      if (d >= cutoff) {
        let sessionLoad = 0;

        for (const item of w.items || []) {
          const exObj = item.exerciseId as any;
          const rawGroup = exObj?.muscleGroup || "Other";
          const bucket = mapMuscleToBucket(rawGroup);

          // Count sets per muscle bucket
          const setsCount = item.sets?.length || 0;
          muscleMap.set(bucket, (muscleMap.get(bucket) || 0) + setsCount);

          // Training load heuristic: reps * (weight or 1) * (rpe or 5)
          for (const s of item.sets || []) {
            const reps = s.reps || 0;
            const weight = s.weight ?? 0;
            const rpe = s.rpe || 5;
            const setLoad = reps * (weight || 1) * rpe;
            sessionLoad += setLoad;
          }
        }

        loadByDay.set(dayKey, (loadByDay.get(dayKey) || 0) + sessionLoad);
      }
    }

    const loadSeries: { dateLabel: string; load: number }[] = [];
    for (let i = LOAD_WINDOW_DAYS - 1; i >= 0; i--) {
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

      loadSeries.push({
        dateLabel: label,
        load: loadByDay.get(key) || 0,
      });
    }

    const muscleBalance = Array.from(muscleMap.entries())
      .map(([group, sets]) => ({ group, sets }))
      .sort((a, b) => b.sets - a.sets);

    // --- weekly consistency & trend (last CONSISTENCY_WEEKS weeks) ---
    const weeklyCounts: number[] = [];
    for (let wIdx = CONSISTENCY_WEEKS - 1; wIdx >= 0; wIdx--) {
      const weekStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - wIdx * 7
      );
      const weekEnd = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate() + 6
      );

      const countThisWeek = workouts.filter((w) => {
        const d = new Date(w.date);
        return d >= weekStart && d <= weekEnd;
      }).length;

      weeklyCounts.push(countThisWeek);
    }

    const weeksWithAnyData = weeklyCounts.filter((c) => c > 0).length;
    let consistency: ConsistencyInfo = emptyConsistency;

    if (weeksWithAnyData > 0) {
      const sum = weeklyCounts.reduce((a, b) => a + b, 0);
      const avgPerWeek = sum / CONSISTENCY_WEEKS;

      const target = 3; // target workouts per week
      let score = (avgPerWeek / target) * 100;
      if (score > 110) score = 110;
      if (score < 0) score = 0;
      score = Math.round(Math.min(score, 100));

      let label = "Moderately consistent";
      if (score >= 80) label = "Very consistent";
      else if (score <= 40) label = "Inconsistent";

      // simple linear regression slope for trend
      const n = weeklyCounts.length;
      const xs = weeklyCounts.map((_v, i) => i);
      const meanX = xs.reduce((a, b) => a + b, 0) / n;
      const meanY = weeklyCounts.reduce((a, b) => a + b, 0) / n;

      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - meanX) * (weeklyCounts[i] - meanY);
        den += (xs[i] - meanX) ** 2;
      }
      const slope = den === 0 ? 0 : num / den;

      let trendLabel = "Stable";
      if (slope > 0.3) trendLabel = "Increasing";
      else if (slope < -0.3) trendLabel = "Decreasing";

      const lastWeekCount = weeklyCounts[weeklyCounts.length - 1] || 0;
      const projectedNextWeek = Math.max(
        0,
        Math.round(lastWeekCount + slope)
      );

      consistency = {
        score,
        label,
        avgPerWeek,
        weeks: CONSISTENCY_WEEKS,
        trendLabel,
        projectedNextWeek,
      };
    }

    // --- recovery flag based on 7-day vs previous 7-day training load ---
    let recoveryFlag = "Not enough data yet";
    let loadChangePhrase = "";

    if (loadSeries.length >= 14) {
      const last7 = loadSeries.slice(-7);
      const prev7 = loadSeries.slice(-14, -7);

      const sumLast7 = last7.reduce((a, d) => a + d.load, 0);
      const sumPrev7 = prev7.reduce((a, d) => a + d.load, 0) || 0;

      if (sumPrev7 === 0 && sumLast7 === 0) {
        recoveryFlag = "Not enough recent training data yet";
      } else if (sumPrev7 === 0 && sumLast7 > 0) {
        recoveryFlag =
          "You’ve recently started training — increase gradually and watch recovery.";
        loadChangePhrase = "your first real training week — build up gradually";
      } else {
        const ratio = sumLast7 / sumPrev7;

        if (ratio >= 1.3) {
          recoveryFlag =
            "Recent training load is much higher than the previous week — consider extra rest or a lighter week.";
        } else if (ratio <= 0.7) {
          recoveryFlag =
            "Recent training load is quite a bit lower — this looks like a deload or recovery phase.";
        } else {
          recoveryFlag =
            "Training load is fairly stable compared to last week — recovery looks balanced.";
        }

        const diffRatio = ratio - 1;
        const pct = Math.round(Math.abs(diffRatio * 100));
        if (pct < 5) {
          loadChangePhrase = "about the same as the previous week";
        } else if (diffRatio > 0) {
          loadChangePhrase = `${pct}% higher than the previous week`;
        } else {
          loadChangePhrase = `${pct}% lower than the previous week`;
        }
      }
    }

    // --- muscle imbalance note ---
    let muscleNote = "";
    const upper =
      muscleBalance.find((m) => m.group === "Upper Body")?.sets || 0;
    const lower =
      muscleBalance.find((m) => m.group === "Lower Body")?.sets || 0;

    if (upper > 0 || lower > 0) {
      if (upper >= lower * 1.4) {
        muscleNote =
          "Your lower body volume is noticeably lower than your upper body — consider adding more leg or glute work.";
      } else if (lower >= upper * 1.4) {
        muscleNote =
          "Your upper body volume is noticeably lower than your lower body — consider adding some extra push/pull work.";
      }
    }

    // --- Coach-Fit Suggests text (short version) ---
    if (consistency.score === null) {
      coachSuggestion =
        "Log a few more weeks of workouts so I can show clearer trends in your training load and balance.";
    } else {
      const consistencyPhrase =
        consistency.label === "Very consistent"
          ? "You're very consistent"
          : consistency.label === "Inconsistent"
          ? "You're a bit inconsistent"
          : "Your consistency is moderate";

      coachSuggestion = `${consistencyPhrase} (~${consistency.avgPerWeek.toFixed(
        1
      )} workouts/week).`;

      if (loadChangePhrase) {
        coachSuggestion += ` Last week's training load was ${loadChangePhrase}.`;
      }

      if (muscleNote) {
        coachSuggestion += ` ${muscleNote}`;
      }
    }

    return {
      stats: { totalWorkouts, workoutsLast7, totalSetsLast7, topExercises },
      timeSeries: series,
      trainingLoadSeries: loadSeries,
      muscleBalance,
      consistency,
      recoveryFlag,
      coachSuggestion,
    };
  }, [workouts]);

  const maxExerciseCount =
    stats.topExercises.length > 0
      ? Math.max(...stats.topExercises.map((e) => e.count))
      : 0;

  const maxMuscleSets =
    muscleBalance.length > 0
      ? Math.max(...muscleBalance.map((m) => m.sets))
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
        {/* Total workouts */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
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

        {/* Workouts last 7 days */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
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

        {/* Total sets last 7 days */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
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

        {/* Consistency score */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Consistency Score (Last {CONSISTENCY_WEEKS} Weeks)
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginTop: 8,
              color: "#111827",
            }}
          >
            {loading || consistency.score === null
              ? "—"
              : `${consistency.score}/100`}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
            {consistency.score === null
              ? "Log a few more weeks to see your consistency."
              : `${consistency.label} · ~${consistency.avgPerWeek.toFixed(
                  1
                )} workouts/week`}
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
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
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
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
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

      {/* TRAINING LOAD */}
      <section
        style={{
          marginBottom: "2rem",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          padding: "1.25rem 1.5rem",
        }}
      >
        <h2 style={{ marginBottom: "0.25rem", fontSize: "1rem" }}>
          Training Load (Last {LOAD_WINDOW_DAYS} Days)
        </h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
          Approximate session load based on reps, weight, and RPE. Spikes may
          indicate heavy weeks that could need more recovery.
        </p>
        <p style={{ marginTop: "0.4rem", color: "#4b5563", fontSize: "0.85rem" }}>
          <strong>Recovery:</strong> {recoveryFlag}
          {consistency.projectedNextWeek !== null && (
            <>
              {" "}
              · <strong>Trend:</strong> {consistency.trendLabel} volume,
              projected {consistency.projectedNextWeek} workouts next week.
            </>
          )}
        </p>

        {/* Coach-Fit Suggests mini card */}
        {coachSuggestion && (
          <div
            style={{
              marginTop: "0.6rem",
              marginBottom: "0.3rem",
              padding: "0.75rem 0.9rem",
              borderRadius: 10,
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              fontSize: "0.88rem",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 4,
                color: "#111827",
              }}
            >
              Coach-Fit Suggests
            </div>
            <p style={{ margin: 0, color: "#4b5563" }}>{coachSuggestion}</p>
          </div>
        )}

        <div style={{ height: 260, marginTop: "0.5rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trainingLoadSeries}
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
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
                  fontSize: 12,
                }}
                formatter={(value) => [
                  Math.round(Number(value)),
                  "Training Load",
                ]}
              />
              <Line
                type="monotone"
                dataKey="load"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* MUSCLE BALANCE */}
      <section
        style={{
          marginBottom: "2rem",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          padding: "1.25rem 1.5rem 1.5rem",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>
          Muscle Balance (Last {LOAD_WINDOW_DAYS} Days)
        </h2>

        {muscleBalance.length === 0 && (
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Once you log a few workouts with muscle groups, we’ll show you how
            your volume is distributed across upper, lower, core, and other
            categories.
          </p>
        )}

        {muscleBalance.length > 0 && (
          <div style={{ marginTop: "0.5rem" }}>
            {muscleBalance.map((m) => {
              const widthPercent =
                maxMuscleSets > 0 ? (m.sets / maxMuscleSets) * 100 : 0;

              return (
                <div key={m.group} style={{ marginBottom: "0.8rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <span>{m.group}</span>
                    <span style={{ color: "#6b7280" }}>
                      {m.sets} set{m.sets > 1 ? "s" : ""}
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
                        background: "#3b82f6",
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

      {/* MOST LOGGED EXERCISES */}
      <section
        style={{
          marginBottom: "2rem",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
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