// ======================= CORE =======================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { connectDB } = require("./config/db");

// ======================= ROUTES =======================
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

const transporter = require("./config/mail");

// ======================= APP =======================
const app = express();
const PORT = process.env.PORT || 5000;

/* ======================================================
   🔥 TRUST PROXY (CRITICAL FOR PRODUCTION)
====================================================== */
app.set("trust proxy", 1);

/* ======================================================
   CORS
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
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors());

/* ======================================================
   BODY PARSER
====================================================== */
app.use(express.json());

/* ======================================================
   🔐 SESSION (PRODUCTION SAFE)
====================================================== */
app.use(
  session({
    name: "skillspardha.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: true, // REQUIRED for HTTPS
      sameSite: "none", // REQUIRED for Google OAuth
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

/* ======================================================
   🧪 SESSION DEBUG (REMOVE AFTER CONFIRMATION)
====================================================== */
app.use((req, res, next) => {
  console.log("──────── SESSION DEBUG ────────");
  console.log("Session ID:", req.sessionID);
  console.log("Has Google Tokens:", !!req.session?.googleTokens);
  console.log("Cookie Header:", req.headers.cookie);
  console.log("──────────────────────────────");
  next();
});

/* ======================================================
   MULTER (IMAGE UPLOAD)
====================================================== */
const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, "uploads", "images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP allowed"));
    }
    cb(null, true);
  },
});

/* ======================================================
   STATIC FILES
====================================================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ======================================================
   IMAGE UPLOAD API
====================================================== */
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: `/uploads/images/${req.file.filename}` });
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
   TEST MAIL
====================================================== */
app.get("/test-mail", async (req, res) => {
  await transporter.sendMail({
    from: `"Test" <${process.env.GMAIL_USER}>`,
    to: "pawantwp@email.com",
    subject: "SMTP Test",
    text: "Mail working",
  });
  res.send("Mail sent");
});

/* ======================================================
   START SERVER
====================================================== */
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server failed:", err);
    process.exit(1);
  }
}

startServer();
