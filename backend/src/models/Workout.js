// backend/src/models/Workout.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const setSchema = new Schema(
  {
    reps: { type: Number, required: true },
    weight: { type: Number, required: true },
    rpe: { type: Number, min: 1, max: 10 },
  },
  { _id: false }
);

const workoutItemSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
    sets: { type: [setSchema], required: true },
  },
  { _id: false }
);

const workoutSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    items: { type: [workoutItemSchema], required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workout", workoutSchema);
