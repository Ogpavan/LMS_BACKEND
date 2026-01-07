const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create folders if they don't exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir("./uploads/thumbnails");
ensureDir("./uploads/videos");

// STORAGE ENGINE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "thumbnail") {
      cb(null, "uploads/thumbnails");
    } else {
      cb(null, "uploads/videos");
    }
  },

  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// FILTER (only images/videos)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "thumbnail") {
    if (!file.mimetype.startsWith("image/"))
      return cb(new Error("Thumbnail must be an image"));
  } else {
    if (!file.mimetype.startsWith("video/"))
      return cb(new Error("Chapter video must be a video"));
  }
  cb(null, true);
};

// Final uploader
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB video max
});

module.exports = upload;
