// src/pages/DashboardPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWorkouts, type Workout } from "../api/workout";
import { fetchRecommendations } from "../api/recommendations";
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

const LOAD_WINDOW_DAYS = 30;
const CONSISTENCY_WEEKS = 8;

interface ConsistencyInfo {
  score: number | null; // 0–100 or null if not enough data
  label: string;
  avgPerWeek: number;
}

// --- helpers used for muscle groups ---
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

  // AI recommendations state (Gemini)
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

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

  // ====== DERIVED STATS FOR EXISTING CHARTS ======
  const { sessionsByWeekday, exerciseTypeData, progressData } = useMemo(() => {
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

    const exerciseTypeData = rawTypes.slice(0, 3);

    // --- 3. Progress over time (line chart) ---
    const monthCounts: Record<string, number> = {};

    for (const w of workouts) {
      const m = getMonthShort(w.date);
      monthCounts[m] = (monthCounts[m] || 0) + 1;
    }

    const progressData = Object.entries(monthCounts).map(
      ([month, sessions]) => ({
        month,
        sessions,
      })
    );

    return { sessionsByWeekday, exerciseTypeData, progressData };
  }, [workouts]);

  // ====== RULE-BASED ANALYTICS FOR COACH SUMMARY ======
  const {
    consistency,
    recoveryFlag,
    loadChangeLabel,
    muscleImbalance,
    coachHeadline,
  } = useMemo(() => {
    const emptyConsistency: ConsistencyInfo = {
      score: null,
      label: "Not enough data yet",
      avgPerWeek: 0,
    };

    if (!workouts || workouts.length === 0) {
      return {
        consistency: emptyConsistency,
        recoveryFlag: "Not enough data yet",
        loadChangeLabel:
          "We need at least two weeks of data to compare weekly training load.",
        muscleImbalance:
          "We need more logged sets across muscle groups to analyze balance.",
        coachHeadline: "Log a few workouts to unlock personalized coaching.",
      };
    }

    const today = new Date();

    // --- TRAINING LOAD + MUSCLE MAP (last 30 days) ---
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LOAD_WINDOW_DAYS);

    const loadByDay = new Map<string, number>();
    const muscleMap = new Map<string, number>();

    for (const w of workouts) {
      const dateObj = new Date(w.date);
      if (dateObj < cutoff) continue;

      const dayKey = dateObj.toISOString().slice(0, 10);
      let sessionLoad = 0;

      for (const item of w.items || []) {
        const exObj = item.exerciseId as any;
        const rawGroup = exObj?.muscleGroup || "Other";
        const bucket = mapMuscleToBucket(rawGroup);

        const setsCount = item.sets?.length || 0;
        muscleMap.set(bucket, (muscleMap.get(bucket) || 0) + setsCount);

        for (const s of item.sets || []) {
          const reps = s.reps || 0;
          const weight = s.weight ?? 0;
          const rpe = s.rpe || 5;
          const setLoad = reps * (weight || 1) * rpe;
          sessionLoad += setLoad;
        }
      }

      if (sessionLoad > 0) {
        loadByDay.set(dayKey, (loadByDay.get(dayKey) || 0) + sessionLoad);
      }
    }

    // Build daily load array for last 30 days (for week-to-week comparison)
    const loadSeries: { dateLabel: string; load: number }[] = [];
    for (let i = LOAD_WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i
      );
      const key = d.toISOString().slice(0, 10);
      loadSeries.push({
        dateLabel: key,
        load: loadByDay.get(key) || 0,
      });
    }

    // --- CONSISTENCY (last CONSISTENCY_WEEKS weeks) ---
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

      const target = 3; // target workouts/week
      let score = (avgPerWeek / target) * 100;
      if (score > 110) score = 110;
      if (score < 0) score = 0;
      score = Math.round(Math.min(score, 100));

      let label = "Moderately consistent";
      if (score >= 80) label = "Very consistent";
      else if (score <= 40) label = "Inconsistent";

      consistency = {
        score,
        label,
        avgPerWeek,
      };
    }

    // --- RECOVERY FLAG (compare last 7 vs previous 7 days) ---
    let recoveryFlag = "Not enough data yet";
    let loadChangeLabel =
      "We need at least two weeks of training load data to compare.";

    if (loadSeries.length >= 14) {
      const last7 = loadSeries.slice(-7);
      const prev7 = loadSeries.slice(-14, -7);

      const sumLast7 = last7.reduce((a, d) => a + d.load, 0);
      const sumPrev7 = prev7.reduce((a, d) => a + d.load, 0) || 0;

      if (sumPrev7 === 0 && sumLast7 === 0) {
        recoveryFlag = "Not enough recent training data yet.";
        loadChangeLabel =
          "We don’t have enough recent training to detect a load change.";
      } else if (sumPrev7 === 0 && sumLast7 > 0) {
        recoveryFlag =
          "You’ve recently started training — increase gradually and watch recovery.";
        loadChangeLabel =
          "This is your first week of significant training load — keep it steady while you adapt.";
      } else {
        const ratio = sumLast7 / sumPrev7;
        const diffPct = ((sumLast7 - sumPrev7) / sumPrev7) * 100;

        const diffRounded = Math.round(Math.abs(diffPct));

        if (ratio >= 1.3) {
          recoveryFlag =
            "Recent training load is much higher than the previous week — consider extra rest or a lighter day.";
          loadChangeLabel = `Last week’s training load was about ${diffRounded}% higher than the previous week.`;
        } else if (ratio <= 0.7) {
          recoveryFlag =
            "Recent training load is quite a bit lower — this looks like a deload or recovery phase.";
          loadChangeLabel = `Last week’s training load was about ${diffRounded}% lower than the previous week.`;
        } else {
          recoveryFlag =
            "Training load is fairly stable compared to last week — recovery looks balanced.";
          loadChangeLabel =
            "Last week’s training load was similar to the previous week.";
        }
      }
    }

    // --- MUSCLE IMBALANCE (upper vs lower) ---
    const upper = muscleMap.get("Upper Body") || 0;
    const lower = muscleMap.get("Lower Body") || 0;

    let muscleImbalance =
      "Upper and lower body volume look fairly balanced in the last month.";

    if (upper + lower === 0) {
      muscleImbalance =
        "We don’t have enough upper/lower body sets logged yet to analyze balance.";
    } else if (lower < upper * 0.6) {
      muscleImbalance =
        "Your lower body volume is noticeably lower than your upper body — consider adding more leg or glute work.";
    } else if (upper < lower * 0.6) {
      muscleImbalance =
        "Your upper body volume is lagging behind your lower body — consider adding more pushing/pulling work.";
    }

    // --- Coach headline (short summary) ---
    let coachHeadline = "Log a few more weeks to see detailed coaching.";

    if (consistency.score !== null) {
      const consPart = `${consistency.label} (~${consistency.avgPerWeek.toFixed(
        1
      )} workouts/week).`;
      coachHeadline = `${consPart} ${loadChangeLabel}`;
    }

    return {
      consistency,
      recoveryFlag,
      loadChangeLabel,
      muscleImbalance,
      coachHeadline,
    };
  }, [workouts]);

  // ====== GEMINI RECOMMENDATIONS HANDLER ======
  const handleViewRecommendations = async () => {
    setInsightsOpen(true);
    setInsightsError(null);

    // If we already have insights cached, just open the panel.
    if (insights) return;

    try {
      setInsightsLoading(true);
      const data = await fetchRecommendations(); // ✅ still uses backend (Gemini)
      setInsights(data.recommendations || "No advice returned.");
    } catch (err: any) {
      console.error("Recommendations error", err);
      setInsightsError(err.message || "Failed to fetch recommendations.");
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <div className="app-main">
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Dashboard</h1>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

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
                <Bar dataKey="sessions" radius={[6, 6, 0, 0]} fill={BLUE} />
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
                  data={
                    exerciseTypeData.length
                      ? exerciseTypeData
                      : [{ name: "No data", value: 1 }]
                  }
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="none"
                >
                  {(
                    exerciseTypeData.length
                      ? exerciseTypeData
                      : [{ name: "No data", value: 1 }]
                  ).map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0 ? BLUE_DARK : index === 1 ? BLUE : GREEN
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Simple legend under chart */}
          <div style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
            {exerciseTypeData.length ? (
              exerciseTypeData.map((t, index) => (
                <div
                  key={t.name}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "999px",
                      background:
                        index === 0 ? BLUE_DARK : index === 1 ? BLUE : GREEN,
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
                  dot={{
                    r: 3,
                    strokeWidth: 1,
                    stroke: BLUE_DARK,
                    fill: "#ffffff",
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 4 – Insights (Rule-based + Gemini) */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Insights</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            High-level coaching based on your recent training patterns.
          </p>

          {/* Rule-based Coach-Fit summary */}
          {!loading && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem 0.9rem",
                borderRadius: 10,
                background: "#f9fafb",
                fontSize: "0.9rem",
                color: "#111827",
              }}
            >
              <strong>Coach-Fit Summary:</strong> {coachHeadline}
              {consistency.score !== null && (
                <div
                  style={{
                    marginTop: "0.35rem",
                    fontSize: "0.8rem",
                    color: "#4b5563",
                  }}
                >
                  Consistency: {consistency.label} (
                  {consistency.avgPerWeek.toFixed(1)} workouts/week)
                </div>
              )}
              <div
                style={{
                  marginTop: "0.35rem",
                  fontSize: "0.8rem",
                  color: "#4b5563",
                }}
              >
                Recovery: {recoveryFlag}
              </div>
              <div
                style={{
                  marginTop: "0.35rem",
                  fontSize: "0.8rem",
                  color: "#4b5563",
                }}
              >
                Muscle balance: {muscleImbalance}
              </div>
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                <Link to="/analytics">View full analytics →</Link>
              </div>
            </div>
          )}

          {/* Gemini button */}
          <p
            style={{
              marginTop: "1rem",
              color: "#6b7280",
              fontSize: "0.85rem",
              fontStyle: "italic",
            }}
          >
            AI insight (Gemini) based on your workout history:
          </p>

          <button
            type="button"
            style={{
              marginTop: "0.3rem",
              padding: "0.6rem 1.4rem",
              background: BLUE_DARK,
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
            onClick={handleViewRecommendations}
            disabled={insightsLoading}
          >
            {insightsLoading ? "Loading…" : "View AI Recommendations"}
          </button>

          {/* Recommendation output (Gemini text) */}
          {insightsOpen && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem 0.9rem",
                borderRadius: 10,
                background: "#f3f4f6",
                fontSize: "0.9rem",
                whiteSpace: "pre-line",
              }}
            >
              {insightsLoading && <span>Generating tips…</span>}
              {insightsError && (
                <span style={{ color: "red" }}>{insightsError}</span>
              )}
              {!insightsLoading && !insightsError && insights && (
                <span>{insights}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;