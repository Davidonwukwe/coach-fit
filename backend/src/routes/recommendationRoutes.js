// backend/src/routes/recommendationRoutes.js
const express = require("express");
const router = express.Router();
const { getRecommendations } = require("../controllers/recommendationController");
const authMiddleware = require("../middleware/auth");

// GET /api/recommendations
router.get("/", authMiddleware, getRecommendations);

module.exports = router;