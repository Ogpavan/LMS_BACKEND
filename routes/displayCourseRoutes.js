const express = require("express");
const router = express.Router();
const displayCourseController = require("../controllers/displayCourseController");

// GET /api/display-courses/by-category
router.get("/by-category", displayCourseController.getCoursesByCategory);

// GET /api/display-courses/names-ids
router.get("/names-ids", displayCourseController.getCoursesNamesAndIds);

// GET /api/display-courses/:id (must be last)
router.get("/:id", displayCourseController.getDisplayCourseDetails);

module.exports = router;
