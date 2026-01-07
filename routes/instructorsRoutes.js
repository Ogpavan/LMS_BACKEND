const express = require("express");
const router = express.Router();
const instructorsController = require("../controllers/instructorsController");

// GET /api/instructors
router.get("/", instructorsController.getStudents);

// POST /api/instructors
router.post("/", instructorsController.createUser);

// PUT /api/students/:user_id
router.put("/:user_id", instructorsController.updateUser);

// PATCH /api/students/:user_id/status
router.patch("/:user_id/status", instructorsController.updateUserStatus);

// DELETE /api/students/:user_id
router.delete("/:user_id", instructorsController.deleteUser);

module.exports = router;
