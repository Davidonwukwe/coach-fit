// backend/src/scripts/seedWorkouts.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Exercise = require("../models/Exercise");
const Workout = require("../models/Workout");

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI not set in .env");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const user = await User.findOne();
    if (!user) {
      console.error("No users found in DB. Create an account first.");
      process.exit(1);
    }

    const exercises = await Exercise.find();
    if (exercises.length === 0) {
      console.error("No exercises found. Add some exercises first.");
      process.exit(1);
    }

    const today = new Date();
    const workoutsToInsert = [];

    // Create workouts for the last 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOffset);

      // 1–3 exercises per workout
      const numExercises = 1 + Math.floor(Math.random() * 3);
      const used = new Set();
      const items = [];

      for (let i = 0; i < numExercises; i++) {
        const ex =
          exercises[Math.floor(Math.random() * exercises.length)];
        if (used.has(ex._id.toString())) continue;
        used.add(ex._id.toString());

        // 2–4 sets per exercise
        const numSets = 2 + Math.floor(Math.random() * 3);
        const sets = [];

        for (let s = 0; s < numSets; s++) {
          sets.push({
            reps: 6 + Math.floor(Math.random() * 7), // 6–12 reps
            weight: 20 + 5 * Math.floor(Math.random() * 10), // 20–65 kg
            rpe: 6 + Math.floor(Math.random() * 4), // 6–9
          });
        }

        items.push({
          exerciseId: ex._id,
          exerciseName: ex.name,
          sets,
        });
      }

      workoutsToInsert.push({
        userId: user._id,
        date,
        items,
        notes: "Seeded workout for testing analytics.",
      });
    }

    if (workoutsToInsert.length === 0) {
      console.log("Nothing to insert.");
      process.exit(0);
    }

    console.log(`Inserting ${workoutsToInsert.length} workouts...`);
    await Workout.insertMany(workoutsToInsert);
    console.log("Done seeding workouts.");

    await mongoose.disconnect();
    console.log("Disconnected. ✅");
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

main();