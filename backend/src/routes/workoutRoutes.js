// backend/src/routes/workoutRoutes.js
const express = require("express");
const router = express.Router();
const { createWorkout, getWorkouts } = require("../controllers/workoutController");
const auth = require("../middleware/auth");

router.post("/", auth, createWorkout);
router.get("/", auth, getWorkouts);

module.exports = router;
