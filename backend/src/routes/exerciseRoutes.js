// backend/src/routes/exerciseRoutes.js
const express = require("express");
const router = express.Router();
const { listExercises, createExercise } = require("../controllers/exerciseController");
const auth = require("../middleware/auth");

router.get("/", auth, listExercises);
router.post("/", auth, createExercise);

module.exports = router;
