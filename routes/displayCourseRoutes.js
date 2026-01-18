const express = require("express");
const router = express.Router();
const displayCourseController = require("../controllers/displayCourseController");

// POST /api/display-courses
router.post("/", displayCourseController.createDisplayCourse);

// GET /api/display-courses (flat list)
router.get("/", displayCourseController.getAllDisplayCourses);

// PUT /api/display-courses/:id (update course)
router.put("/:id", displayCourseController.updateDisplayCourse);

// DELETE /api/display-courses/:id (delete course)
router.delete("/:id", displayCourseController.deleteDisplayCourse);

// GET /api/display-courses/:id/details (get display_course_details for a course)
router.get("/:id/details", displayCourseController.getDisplayCourseDetails);

// PUT /api/display-courses/:id/details (save or update course_json)
router.put("/:id/details", displayCourseController.saveDisplayCourseJson);

// GET /api/display-courses/:id
router.get("/:id", displayCourseController.getDisplayCourseById);

module.exports = router;
