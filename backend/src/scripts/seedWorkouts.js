// backend/src/scripts/seedWorkouts.js
require("dotenv").config();
const connectDb = require("../config/db");
const Workout = require("../models/Workout");
const Exercise = require("../models/Exercise");
const User = require("../models/User");

const WORKOUT_COUNT = 100;
const MONTH_WINDOW = 6;

// ---- helpers ----
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// random date between now and N months ago
function randomDateWithinLastMonths(months) {
  const now = new Date();
  const past = new Date();
  past.setMonth(past.getMonth() - months);

  const diff = now.getTime() - past.getTime();
  const randOffset = Math.random() * diff;

  return new Date(past.getTime() + randOffset);
}

// Basic templates for exercises if DB is empty
const DEFAULT_EXERCISES = [
  { name: "Bench Press", muscleGroup: "Chest" },
  { name: "Squat", muscleGroup: "Legs" },
  { name: "Deadlift", muscleGroup: "Back" },
  { name: "Overhead Press", muscleGroup: "Shoulders" },
  { name: "Lat Pulldown", muscleGroup: "Back" },
  { name: "Hammer Curl", muscleGroup: "Arms" },
  { name: "Skull Crushers", muscleGroup: "Arms" },
];

async function ensureExercises() {
  let exercises = await Exercise.find();
  if (exercises.length === 0) {
    console.log("No exercises found, creating defaults...");
    exercises = await Exercise.insertMany(DEFAULT_EXERCISES);
  }
  return exercises;
}

async function getAnyUser() {
  // ❗ Option 1: use first user in collection
  const user = await User.findOne();
  if (!user) {
    throw new Error(
      "No users found. Register at least one user via the app before running the seeder."
    );
  }
  return user;
}

async function run() {
  try {
    await connectDb();

    const user = await getAnyUser();
    const exercises = await ensureExercises();

    console.log(
      `Seeding ${WORKOUT_COUNT} workouts for user ${user.email} over last ${MONTH_WINDOW} months...`
    );

    const workoutsToInsert = [];

    for (let i = 0; i < WORKOUT_COUNT; i++) {
      const numExercises = randomInt(1, 4); // 1–4 exercises per workout
      const items = [];

      for (let j = 0; j < numExercises; j++) {
        const exercise =
          exercises[randomInt(0, exercises.length - 1)];

        const numSets = randomInt(1, 4); // 1–4 sets
        const sets = [];

        for (let s = 0; s < numSets; s++) {
          const reps = randomInt(5, 15);
          const weight = randomInt(10, 120); // kg
          const rpe = randomInt(6, 9);

          sets.push({ reps, weight, rpe });
        }

        items.push({
          exerciseId: exercise._id,
          exerciseName: exercise.name,
          sets,
        });
      }

      const randomDate = randomDateWithinLastMonths(MONTH_WINDOW);

      workoutsToInsert.push({
        userId: user._id,
        date: randomDate,
        items,
        notes:
          Math.random() < 0.4
            ? "Auto-generated workout for testing analytics."
            : "",
      });
    }

    await Workout.insertMany(workoutsToInsert);
    console.log("✅ Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

run();