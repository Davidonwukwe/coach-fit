// backend/src/routes/workoutRoutes.js
const express = require("express");
const router = express.Router();
const {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require("../controllers/workoutController");
const authMiddleware = require("../middleware/auth");

// Create workout
router.post("/", authMiddleware, createWorkout);

// List workouts (with optional date filters)
router.get("/", authMiddleware, getWorkouts);

// Get single workout
router.get("/:id", authMiddleware, getWorkoutById);

// Update workout (used for editing notes, etc.)
router.put("/:id", authMiddleware, updateWorkout);

// Delete a single workout
router.delete("/:id", authMiddleware, deleteWorkout);

module.exports = router;