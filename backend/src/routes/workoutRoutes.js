// backend/src/routes/workoutRoutes.js
const express = require("express");
const router = express.Router();
const {
  createWorkout,
  getWorkouts,
  deleteWorkout,
} = require("../controllers/workoutController");
const authMiddleware = require("../middleware/auth");

// Create workout
router.post("/", authMiddleware, createWorkout);

// List workouts (with optional date filters)
router.get("/", authMiddleware, getWorkouts);

// Delete a single workout
router.delete("/:id", authMiddleware, deleteWorkout);

module.exports = router; 