import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWorkouts, type Workout } from "../api/workout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const BLUE = "#60a5fa";
const BLUE_DARK = "#3b82f6";
const GREEN = "#22c55e";
const GRAY_BG = "#f9fafb";

function getWeekdayShort(dateStr: string) {
  const d = new Date(dateStr);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

function getMonthShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("default", { month: "short" });
}

const DashboardPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWorkouts();
        setWorkouts(data);
      } catch {
        setError("Failed to load workouts.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalSessions = workouts.length;

  // ====== DERIVED STATS FOR CHARTS ======
  const {
    sessionsByWeekday,
    exerciseTypeData,
    progressData,
  } = useMemo(() => {
    // --- 1. Total sessions per weekday (for bar chart) ---
    const weekdaysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekdayCounts: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    for (const w of workouts) {
      const label = getWeekdayShort(w.date);
      if (weekdayCounts[label] != null) {
        weekdayCounts[label] += 1;
      }
    }

    const sessionsByWeekday = weekdaysOrder.map((d) => ({
      day: d,
      sessions: weekdayCounts[d],
    }));

    // --- 2. Preferred exercise types (pie chart) ---
    // Use muscleGroup if present, otherwise fall back to generic buckets.
    const typeCounts: Record<string, number> = {};

    for (const w of workouts) {
      for (const item of w.items || []) {
        const exObj = item.exerciseId as any;
        const group = exObj?.muscleGroup || "Other";
        typeCounts[group] = (typeCounts[group] || 0) + 1;
      }
    }

    const rawTypes = Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Show at most 3 main categories to keep the donut clean
    const exerciseTypeData = rawTypes.slice(0, 3);

    // --- 3. Progress over time (line chart) ---
    // Count workouts per month
    const monthCounts: Record<string, number> = {};

    for (const w of workouts) {
      const m = getMonthShort(w.date);
      monthCounts[m] = (monthCounts[m] || 0) + 1;
    }

    const progressData = Object.entries(monthCounts).map(([month, sessions]) => ({
      month,
      sessions,
    }));

    return { sessionsByWeekday, exerciseTypeData, progressData };
  }, [workouts]);

  return (
    <div className="app-main">
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Dashboard</h1>

      {error && (
        <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>
      )}

      {/* Grid Layout */}
      <div className="dashboard-grid">
        {/* CARD 1 – Total Sessions per Week (BAR CHART) */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Total Sessions per Week</h2>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            {loading ? "…" : totalSessions}
          </div>

          <div style={{ width: "100%", height: 190 }}>
            <ResponsiveContainer>
              <BarChart
                data={sessionsByWeekday}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="sessions"
                  radius={[6, 6, 0, 0]}
                  fill={BLUE}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 2 – Preferred Exercise Types (PIE / DONUT) */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Preferred Exercise Types</h2>

          <div
            style={{
              width: "100%",
              height: 190,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: GRAY_BG,
              borderRadius: 10,
            }}
          >
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={exerciseTypeData.length ? exerciseTypeData : [{ name: "No data", value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="none"
                >
                  {(exerciseTypeData.length ? exerciseTypeData : [{ name: "No data", value: 1 }]).map(
                    (_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? BLUE_DARK
                            : index === 1
                            ? BLUE
                            : GREEN
                        }
                      />
                    )
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Simple legend under chart */}
          <div style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
            {exerciseTypeData.length ? (
              exerciseTypeData.map((t, index) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "999px",
                      background:
                        index === 0
                          ? BLUE_DARK
                          : index === 1
                          ? BLUE
                          : GREEN,
                    }}
                  />
                  <span>{t.name}</span>
                </div>
              ))
            ) : (
              <span style={{ color: "#9ca3af" }}>
                Log workouts to see your top exercise types.
              </span>
            )}
          </div>
        </div>

        {/* CARD 3 – Progress Over Time (LINE CHART) */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Progress Over Time</h2>

          <div style={{ width: "100%", height: 190 }}>
            <ResponsiveContainer>
              <LineChart
                data={progressData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ stroke: "#cbd5f5", strokeWidth: 2 }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke={BLUE_DARK}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1, stroke: BLUE_DARK, fill: "#ffffff" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 4 – Insights (AI later) */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Insights</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Soon this will show AI-powered recommendations based on your recent
            training load and favorite exercises.
          </p>

          <button
            type="button"
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1.4rem",
              background: BLUE_DARK,
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
            onClick={() => alert("Gemini integration coming next 🙂")}
          >
            View Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;