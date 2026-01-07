// PATCH /api/liveclasses/:id/suspend
// GET /api/liveclasses/all (for students)

const express = require("express");
const router = express.Router();
const liveClassesController = require("../controllers/liveClassesController");
router.get("/all", liveClassesController.getAllLiveClasses);

router.patch("/:id/suspend", liveClassesController.suspendLiveClass);
// GET /api/liveclasses?teacher_id=xx (instructor's own classes)
router.get("/", liveClassesController.getInstructorLiveClasses);
// POST /api/liveclasses
router.post("/", liveClassesController.createLiveClass);

// GET /api/liveclasses/courses-with-chapters
router.get(
  "/courses-with-chapters",
  liveClassesController.getCoursesWithChapters
);

module.exports = router;
