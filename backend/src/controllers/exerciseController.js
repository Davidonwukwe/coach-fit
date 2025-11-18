// backend/src/controllers/exerciseController.js
const Exercise = require("../models/Exercise");

/**
 * DEFAULT EXERCISES (only inserted ONE TIME)
 * These will auto-populate if DB is empty.
 */
const DEFAULT_EXERCISES = [
  // ---------- CHEST ----------
  { name: "Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Dumbbell Bench Press", muscleGroup: "Chest", equipment: "Dumbbells" },
  { name: "Incline Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Chest Fly Machine", muscleGroup: "Chest", equipment: "Machine" },
  { name: "Push-Up", muscleGroup: "Chest", equipment: "Bodyweight" },

  // ---------- BACK ----------
  { name: "Deadlift", muscleGroup: "Back", equipment: "Barbell" },
  { name: "Lat Pulldown", muscleGroup: "Back", equipment: "Machine" },
  { name: "Pull-Up", muscleGroup: "Back", equipment: "Bodyweight" },
  { name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable" },
  { name: "Bent-Over Row", muscleGroup: "Back", equipment: "Barbell" },

  // ---------- SHOULDERS ----------
  { name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell" },
  { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", equipment: "Dumbbells" },
  { name: "Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbells" },
  { name: "Face Pull", muscleGroup: "Shoulders", equipment: "Cable" },

  // ---------- ARMS ----------
  { name: "Barbell Bicep Curl", muscleGroup: "Arms", equipment: "Barbell" },
  { name: "Dumbbell Curl", muscleGroup: "Arms", equipment: "Dumbbells" },
  { name: "Tricep Pushdown", muscleGroup: "Arms", equipment: "Cable" },
  { name: "Skull Crushers", muscleGroup: "Arms", equipment: "Barbell" },
  { name: "Hammer Curl", muscleGroup: "Arms", equipment: "Dumbbells" },

  // ---------- LEGS ----------
  { name: "Squat", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Leg Press", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Lunges", muscleGroup: "Legs", equipment: "Dumbbells" },
  { name: "Romanian Deadlift", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Leg Extension", muscleGroup: "Legs", equipment: "Machine" },

  // ---------- CORE ----------
  { name: "Plank", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Cable Crunch", muscleGroup: "Core", equipment: "Cable" },
  { name: "Hanging Leg Raise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Russian Twist", muscleGroup: "Core", equipment: "Bodyweight" }
];

/**
 * Inserts default exercises IF database is empty.
 */
async function seedDefaultExercises() {
  const count = await Exercise.countDocuments();
  if (count === 0) {
    console.log("🌱 Seeding default exercises...");
    await Exercise.insertMany(DEFAULT_EXERCISES);
    console.log("✅ Default exercises added.");
  }
}

// GET /api/exercises
exports.listExercises = async (req, res) => {
  try {
    await seedDefaultExercises(); // auto-populate DB if empty

    const exercises = await Exercise.find().sort({ muscleGroup: 1, name: 1 });
    res.json(exercises);
  } catch (err) {
    console.error("List exercises error:", err);
    res.status(500).json({ message: "Failed to fetch exercises." });
  }
};

// POST /api/exercises
exports.createExercise = async (req, res) => {
  try {
    const { name, muscleGroup, equipment } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Exercise name is required." });
    }

    // Avoid duplicates
    const existing = await Exercise.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Exercise already exists." });
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      muscleGroup: muscleGroup?.trim() || "Other",
      equipment: equipment?.trim() || "Unknown",
    });

    res.status(201).json(exercise);
  } catch (err) {
    console.error("Create exercise error:", err);
    res.status(500).json({ message: "Failed to create exercise." });
  }
};