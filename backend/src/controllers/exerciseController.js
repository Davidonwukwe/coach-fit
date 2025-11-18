// backend/src/controllers/exerciseController.js
const Exercise = require("../models/Exercise");

// GET /api/exercises
exports.listExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ muscleGroup: 1, name: 1 });
    res.json(exercises);
  } catch (err) {
    console.error("List exercises error:", err);
    res.status(500).json({ message: "Failed to fetch exercises." });
  }
};

// POST /api/exercises
exports.createExercise = async (req, res) => {
  try {
    const { name, muscleGroup, equipment } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Exercise name is required." });
    }

    const existing = await Exercise.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Exercise already exists." });
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      muscleGroup: muscleGroup?.trim(),
      equipment: equipment?.trim(),
    });

    res.status(201).json(exercise);
  } catch (err) {
    console.error("Create exercise error:", err);
    res.status(500).json({ message: "Failed to create exercise." });
  }
};
