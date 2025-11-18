// backend/src/models/Exercise.js
const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    muscleGroup: { type: String, trim: true },
    equipment: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);
