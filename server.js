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
const contactUsRoutes = require("./routes/contactUsRoutes");
const displayCourseRoutes = require("./routes/displayCourseRoutes");
const courseBuyRoutes = require("./routes/courseBuyRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const session = require("express-session");
const app = express();
const PORT = process.env.PORT || 5000;
const path = require("path");

// Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

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

app.use("/api/contactus", contactUsRoutes);
app.use("/api/display-courses", displayCourseRoutes);

app.use("/api/course-buy", courseBuyRoutes);
app.use("/api/payment", paymentRoutes);

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
