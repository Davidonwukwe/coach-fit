// backend/src/controllers/workoutController.js
const Workout = require("../models/Workout");

const createWorkout = async (req, res) => {
  try {
    const { date, items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one exercise is required" });
    }

    const workout = await Workout.create({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      items,
      notes,
    });

    res.status(201).json(workout);
  } catch (err) {
    console.error("Create workout error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getWorkouts = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { userId: req.user._id };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const workouts = await Workout.find(query)
      .populate("items.exerciseId")
      .sort({ date: -1 });

    res.json(workouts);
  } catch (err) {
    console.error("Get workouts error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createWorkout, getWorkouts };
