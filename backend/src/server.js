// backend/src/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (_req, res) => {
  res.json({ message: "Coach-Fit API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/exercises", require("./routes/exerciseRoutes"));
app.use("/api/workouts", require("./routes/workoutRoutes"));

// basic error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
