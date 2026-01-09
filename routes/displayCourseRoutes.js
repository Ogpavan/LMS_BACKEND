const express = require("express");
const router = express.Router();
const {
  getCoursesByCategory,
} = require("../controllers/displayCourseController");

// GET /api/display-courses/by-category
router.get("/by-category", getCoursesByCategory);

module.exports = router;
