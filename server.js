require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studentsRoutes = require("./routes/studentsRoutes");
const instructorsRoutes = require("./routes/instructorsRoutes");
const liveclassesRoutes = require("./routes/liveClassesRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");

const session = require("express-session");
const app = express();
const PORT = process.env.PORT || 5000;
const path = require("path");

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // your frontend URL
    credentials: true, // allow cookies/session
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set secure: true if using HTTPS
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/menu", menuRoutes);
app.use("/api/courses", courseRoutes);

app.use("/api/students", studentsRoutes);
app.use("/api/instructors", instructorsRoutes);

app.use("/api/liveclasses", liveclassesRoutes);

app.use("/api/google", googleAuthRoutes);
app.use("/api/enrollments", enrollmentRoutes);
// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
