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
      return res
        .status(400)
        .json({ message: "At least one exercise item is required." });
    }

    const workout = await Workout.create({
      userId: req.userId,
      date: date ? new Date(date) : new Date(),
      items,
      notes,
    });

    const populated = await workout.populate(
      "items.exerciseId",
      "name muscleGroup"
    );

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

// GET /api/workouts/:id
exports.getWorkoutById = async (req, res) => {
  try {
    const { id } = req.params;

    const workout = await Workout.findOne({
      _id: id,
      userId: req.userId,
    }).populate("items.exerciseId", "name muscleGroup");

    if (!workout) {
      return res
        .status(404)
        .json({ message: "Workout not found for this user." });
    }

    res.json(workout);
  } catch (err) {
    console.error("Get workout by id error:", err);
    res.status(500).json({ message: "Failed to fetch workout." });
  }
};

// PUT /api/workouts/:id
// For now we mainly support updating notes (and optionally date/items if sent)
exports.updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, items, notes } = req.body;

    const update = {};

    if (date) {
      update.date = new Date(date);
    }

    // Only update items if provided & non-empty (to avoid wiping accidentally)
    if (items && Array.isArray(items) && items.length > 0) {
      update.items = items;
    }

    // Allow setting notes to empty string (clear notes)
    if (typeof notes !== "undefined") {
      update.notes = notes;
    }

    const workout = await Workout.findOneAndUpdate(
      { _id: id, userId: req.userId },
      update,
      { new: true, runValidators: true }
    ).populate("items.exerciseId", "name muscleGroup");

    if (!workout) {
      return res
        .status(404)
        .json({ message: "Workout not found for this user." });
    }

    return res.json(workout);
  } catch (err) {
    console.error("Update workout error:", err);
    return res.status(500).json({ message: "Failed to update workout." });
  }
};

// DELETE /api/workouts/:id
exports.deleteWorkout = async (req, res) => {
  try {
    const { id } = req.params;

    // Make sure we only delete workouts belonging to the logged-in user
    const deleted = await Workout.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Workout not found for this user." });
    }

    return res.json({ message: "Workout deleted successfully." });
  } catch (err) {
    console.error("Delete workout error:", err);
    return res.status(500).json({ message: "Failed to delete workout." });
  }
};