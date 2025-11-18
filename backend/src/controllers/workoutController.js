// backend/src/controllers/workoutController.js
const Workout = require("../models/Workout");

// POST /api/workouts
// Body example:
// {
//   "date": "2025-11-18",
//   "items": [
//     {
//       "exerciseId": "...",
//       "sets": [
//         { "reps": 8, "weight": 60, "rpe": 7 },
//         { "reps": 8, "weight": 60, "rpe": 8 }
//       ]
//     }
//   ],
//   "notes": "Felt good today"
// }
exports.createWorkout = async (req, res) => {
  try {
    const { date, items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one exercise item is required." });
    }

    const workout = await Workout.create({
      userId: req.userId,
      date: date ? new Date(date) : new Date(),
      items,
      notes,
    });

    const populated = await workout.populate("items.exerciseId", "name muscleGroup");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create workout error:", err);
    res.status(500).json({ message: "Failed to create workout." });
  }
};

// GET /api/workouts?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getWorkouts = async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = { userId: req.userId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const workouts = await Workout.find(filter)
      .sort({ date: -1 })
      .populate("items.exerciseId", "name muscleGroup");

    res.json(workouts);
  } catch (err) {
    console.error("Get workouts error:", err);
    res.status(500).json({ message: "Failed to fetch workouts." });
  }
};
