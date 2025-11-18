// backend/src/controllers/exerciseController.js
const Exercise = require("../models/Exercise");

const listExercises = async (_req, res) => {
  try {
    const exercises = await Exercise.find().sort({ muscleGroup: 1, name: 1 });
    res.json(exercises);
  } catch (err) {
    console.error("List exercises error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const createExercise = async (req, res) => {
  try {
    const { name, muscleGroup, equipment } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const ex = await Exercise.create({ name, muscleGroup, equipment });
    res.status(201).json(ex);
  } catch (err) {
    console.error("Create exercise error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { listExercises, createExercise };
