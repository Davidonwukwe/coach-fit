// backend/src/controllers/recommendationController.js
const Workout = require("../models/Workout");
const { generateRecommendations } = require("../services/geminiClient");

// GET /api/recommendations
// Returns AI-generated training tips for the logged-in user
exports.getRecommendations = async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.userId })
      .sort({ date: 1 })
      .populate("items.exerciseId", "name muscleGroup");

    if (!workouts.length) {
      return res.json({
        recommendations:
          "Once you log a few workouts, I'll analyze them and suggest how to balance your training. " +
          "For now, aim for 2–3 full-body or upper/lower sessions per week with at least one rest day in between.",
      });
    }

    const now = new Date();

    // Last 30 days summary
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recent = workouts.filter((w) => w.date >= thirtyDaysAgo);

    const totalWorkouts = workouts.length;
    const recentWorkouts = recent.length;

    // Per-day counts for last 30 days (for context)
    const perDay = {};
    for (const w of recent) {
      const key = w.date.toISOString().slice(0, 10);
      perDay[key] = (perDay[key] || 0) + 1;
    }

    // Muscle-group frequency
    const muscleCounts = {};
    for (const w of workouts) {
      for (const item of w.items || []) {
        const ex = item.exerciseId || {};
        const muscle = ex.muscleGroup || "Unknown";
        muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
      }
    }

    // Average sets per workout
    let totalSets = 0;
    for (const w of workouts) {
      for (const item of w.items || []) {
        totalSets += item.sets?.length || 0;
      }
    }
    const avgSetsPerWorkout =
      totalWorkouts > 0 ? +(totalSets / totalWorkouts).toFixed(1) : 0;

    const summary = {
      totalWorkouts,
      recentWorkoutsLast30Days: recentWorkouts,
      averageSetsPerWorkout: avgSetsPerWorkout,
      workoutsPerDayLast30Days: perDay,
      muscleGroupFrequency: muscleCounts,
    };

        const prompt = `
                You are an experienced strength & conditioning coach.

                Analyze the following JSON summary of ONE user's workout history from the app "Coach-Fit".
                Based on the user's actual training patterns, write **exactly 4** practical training recommendations.

                Focus on:
                - Weekly frequency & consistency patterns
                - Muscle group balance (push/pull/legs, upper vs lower, or any imbalance in the data)
                - Progressive overload (volume, sets, difficulty)
                - Recovery/rest strategy if training volume is high
                - Correcting any weaknesses or overuse in their log

                STRICT RULES:
                - Output ONLY bullet points starting with "- " (hyphen + space)
                - No intro text and no closing summary
                - Each bullet point must be **1–2 sentences**, max.
                - Speak directly to the user ("you"), friendly & concise.
                - No emojis.
                - Avoid repeating the same idea in multiple bullets.
                - Base everything on the actual data in the summary (don’t make anything up).

                Workout summary JSON:
                ${JSON.stringify(summary, null, 2)}
            `;

    const text = await generateRecommendations(prompt);

    return res.json({ recommendations: text });
  } catch (err) {
    console.error("Recommendations error:", err);
    return res
      .status(500)
      .json({ message: "Failed to generate recommendations." });
  }
};