const express = require("express");
const router = express.Router();
const instructorsController = require("../controllers/instructorsController");

// GET /api/instructors
router.post("/create", instructorsController.createUser);
router.get("/role/:role_id", instructorsController.getUsersByRole);
router.put("/:user_id", instructorsController.updateUser);
router.patch("/:user_id/status", instructorsController.updateUserStatus);
router.delete("/:user_id", instructorsController.deleteUser);

module.exports = router;
