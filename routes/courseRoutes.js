const express = require("express");
const upload = require("../middlewares/upload.js");
const router = express.Router();
const courseController = require("../controllers/courseController");

// Dynamic: thumbnail + videos with dynamic fieldnames
router.post(
  "/upload",
  upload.any(), // accepts all dynamic file fields
  courseController.uploadCourse
);

router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourseById);

module.exports = router;
