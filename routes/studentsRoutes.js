const express = require("express");
const router = express.Router();
const studentsController = require("../controllers/studentsController");

// GET /api/students
router.get("/", studentsController.getStudents);

// POST /api/students
router.post("/", studentsController.createUser);

// PUT /api/students/:user_id
router.put("/:user_id", studentsController.updateUser);

// PATCH /api/students/:user_id/status
router.patch("/:user_id/status", studentsController.updateUserStatus);

// DELETE /api/students/:user_id
router.delete("/:user_id", studentsController.deleteUser);

module.exports = router;
