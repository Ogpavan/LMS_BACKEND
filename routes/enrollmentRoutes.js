const express = require("express");
const router = express.Router();
const EnrollmentController = require("../controllers/enrollmentController");

// List all enrollments, filter by course_id or student_id
router.get("/", EnrollmentController.list);
// Get a single enrollment
router.get("/:id", EnrollmentController.get);
// Enroll a student
router.post("/", EnrollmentController.create);
// Update enrollment
router.put("/:id", EnrollmentController.update);
// Delete (soft) enrollment
router.delete("/:id", EnrollmentController.remove);


module.exports = router;
