const express = require("express");
const router = express.Router();
const liveClassesController = require("../controllers/liveClassesController");

/* ======================================================
   STUDENT ROUTES
====================================================== */

// GET /api/liveclasses/all (for students – upcoming)
router.get("/all", liveClassesController.getAllLiveClasses);

// GET /api/liveclasses/students/:userId/live-classes
router.get(
  "/students/:userId/live-classes",
  liveClassesController.getStudentLiveClasses,
);

/* ======================================================
   DROPDOWNS / META
====================================================== */

// GET /api/liveclasses/courses-with-chapters
router.get("/courses-with-chapters", liveClassesController.getCoursesDropdown);

/* ======================================================
   INSTRUCTOR ROUTES
====================================================== */

// GET /api/liveclasses?teacher_id=xx
router.get("/", liveClassesController.getInstructorLiveClasses);

// POST /api/liveclasses (create Google Meet + Calendar event)
router.post("/", liveClassesController.createLiveClass);

// PATCH /api/liveclasses/:id/suspend (DB only – soft stop)
router.patch("/:id/suspend", liveClassesController.suspendLiveClass);

// ❌ DELETE /api/liveclasses/:id/cancel
// 🔥 HARD DELETE → kills Google Meet link
router.delete("/:id/cancel", liveClassesController.cancelLiveClass);

module.exports = router;
