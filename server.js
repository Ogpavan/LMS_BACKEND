// Image upload dependencies
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");

const { connectDB } = require("./config/db");

// Routes
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
const courseCategoryRoutes = require("./routes/courseCategoryRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/* ======================================================
   MULTER (ONLY CHANGE IS HERE)
====================================================== */

// Multer storage for image uploads
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "uploads", "images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

// ✅ ONLY enhancement: limits + fileFilter
const upload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP images allowed"), false);
    }
    cb(null, true);
  },
});

/* ======================================================
   CORS CONFIGURATION
====================================================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://skillspardha.com",
  "https://www.skillspardha.com",
  "https://app.skillspardha.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed for this origin"));
      }
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
      "PATCH",
      "HEAD",
      "XHR",
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Handle preflight requests
app.options("*", cors());

/* ======================================================
   EXPRESS MIDDLEWARE
====================================================== */
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  }),
);

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ======================================================
   IMAGE UPLOAD ENDPOINT
====================================================== */
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const url = `/uploads/images/${req.file.filename}`;
  res.json({ url });
});

/* ======================================================
   ROUTES
====================================================== */
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
app.use("/api/category", courseCategoryRoutes);

/* ======================================================
   START SERVER
====================================================== */
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
