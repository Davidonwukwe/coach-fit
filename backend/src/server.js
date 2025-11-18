// backend/src/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDb = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

connectDb();

app.get("/", (req, res) => {
  res.send("Coach-Fit API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/workouts", workoutRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
