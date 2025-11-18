const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello to Fitness Tracker API");
});

// --- NEW MONGOOSE CONNECT STYLE ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

// routes
// const exercisesRouter = require("./routes/exercises");
// const usersRouter = require("./routes/users");

// app.use("/exercises", exercisesRouter);
// app.use("/users", usersRouter);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
